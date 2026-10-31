#!/usr/bin/env node
// The NamedFirst buyer-question generator, run from the command line.
//
// It generates questions and measures nothing. The list comes from prompts-gen.js,
// the same file the free Baseline Kit and the paid baseline's review page load, so
// the list printed here is the list a $149 baseline would start from. That file is
// loaded through node:vm and never rewritten here: a second copy of the templates
// is a second list. prompts-gen.js beside this script is written by
// site/scripts/build-plugin.mjs in the NamedFirst repo and is never edited by hand.
//
//   node questions.mjs --biz "Acme Plumbing" --city "Austin" --what "plumber" \
//     [--products "water heaters, drain cleaning"] [--comps "Rival One, Rival Two"] \
//     [--diff "family owned"] [--json]
//
// No network request, no dependency. Exit 0 on a list, 2 on a usage error.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { parseArgs } from 'node:util';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const GENERATOR_FILE = path.join(HERE, 'prompts-gen.js');
const MAX_PRODUCTS = 4;
const MAX_COMPETITORS = 3;
const GRADES = ['yes', 'intel', 'brand'];

const USAGE = `Usage: node questions.mjs --biz "<business name>" --city "<city or area served>" --what "<what it does, in a buyer's words>"
         [--products "a, b"] [--comps "a, b"] [--diff "<one differentiator>"] [--json]

  --biz       the business name (required)
  --city      the city or area it serves (required)
  --what      what it does as a plain noun phrase with no article, such as "emergency plumber" (required)
  --products  up to ${MAX_PRODUCTS} products or services, separated by commas
  --comps     up to ${MAX_COMPETITORS} competitors, separated by commas
  --diff      one differentiator, such as "family owned"
  --json      print the questions as a JSON array instead of the grouped list
`;

// The generator is a browser file that attaches NFPrompts to the global object. A
// fresh vm context gives it one without touching ours; the results were made in
// another realm, so they are copied into plain objects before they leave.
function loadGenerator() {
  let source;
  try {
    source = fs.readFileSync(GENERATOR_FILE, 'utf8');
  } catch {
    throw new Error('prompts-gen.js is missing next to this script. Reinstall the plugin.');
  }
  const context = vm.createContext({});
  vm.runInContext(source, context, { filename: 'prompts-gen.js' });
  const generator = context.NFPrompts;
  if (!generator || typeof generator.buildPrompts !== 'function') throw new Error('prompts-gen.js did not define NFPrompts.buildPrompts');
  const plain = (value) => JSON.parse(JSON.stringify(value));
  return {
    order: plain(generator.CLUSTER_ORDER),
    build: (inputs) => plain(generator.buildPrompts(plain(inputs))),
  };
}

const splitList = (value) => String(value ?? '').split(',').map((part) => part.trim()).filter(Boolean);

function readInputs(argv) {
  const { values } = parseArgs({
    args: argv,
    strict: true,
    options: {
      biz: { type: 'string' },
      city: { type: 'string' },
      what: { type: 'string' },
      products: { type: 'string' },
      comps: { type: 'string' },
      diff: { type: 'string' },
      json: { type: 'boolean', default: false },
      help: { type: 'boolean', short: 'h', default: false },
    },
  });
  return values;
}

function main(argv) {
  let values;
  try {
    values = readInputs(argv);
  } catch (err) {
    console.error(`${err.message}\n\n${USAGE}`);
    return 2;
  }
  if (values.help) {
    console.log(USAGE);
    return 0;
  }
  const biz = (values.biz ?? '').trim();
  const city = (values.city ?? '').trim();
  const what = (values.what ?? '').trim();
  const missing = [['--biz', biz], ['--city', city], ['--what', what]].filter(([, value]) => !value).map(([flag]) => flag);
  if (missing.length) {
    console.error(`Missing ${missing.join(', ')}. The business name, the city or area served and what the business does are required.\n\n${USAGE}`);
    return 2;
  }
  const products = splitList(values.products);
  const comps = splitList(values.comps);
  const diff = (values.diff ?? '').trim();
  if (products.length > MAX_PRODUCTS) console.error(`Note: ${products.length} products given; the list uses the first ${MAX_PRODUCTS}.`);
  if (comps.length > MAX_COMPETITORS) console.error(`Note: ${comps.length} competitors given; the list uses the first ${MAX_COMPETITORS}.`);

  let generator;
  try {
    generator = loadGenerator();
  } catch (err) {
    console.error(err.message);
    return 2;
  }
  const questions = generator.build({ biz, city, what, products, comps, diff }).map((q) => ({
    id: Number(q.id), cat: String(q.cat), cluster: String(q.cluster), winnable: String(q.winnable), text: String(q.text),
  }));

  if (values.json) {
    console.log(JSON.stringify(questions, null, 2));
    return 0;
  }

  const tally = Object.fromEntries(GRADES.map((grade) => [grade, questions.filter((q) => q.winnable === grade).length]));
  console.log(`Buyer questions for ${biz} (${city})`);
  console.log(`${questions.length} questions: ${tally.yes} yes, ${tally.intel} intel, ${tally.brand} brand`);
  for (const cat of generator.order) {
    const group = questions.filter((q) => q.cat === cat);
    if (!group.length) continue;
    console.log(`\n${group[0].cluster} (${cat}, ${group.length})`);
    for (const q of group) console.log(`  ${String(q.id).padStart(3)}  [${q.winnable}]  ${q.text}`);
  }
  const unused = [
    products.length ? '' : 'products',
    comps.length ? '' : 'competitors',
    diff ? '' : 'a differentiator',
  ].filter(Boolean);
  console.log(`\nyes: counted, a question a buyer asks before hiring. intel: names a competitor, measured and never counted. brand: names ${biz}, answered with the business by construction, so never in a named rate.`);
  if (unused.length) console.log(`Adding ${unused.length > 1 ? `${unused.slice(0, -1).join(', ')} and ${unused.at(-1)}` : unused[0]} sharpens the list; it reaches 100 only at four products and three competitors.`);
  console.log('This list is questions only. Nothing here asks an engine anything.');
  return 0;
}

process.exitCode = main(process.argv.slice(2));
