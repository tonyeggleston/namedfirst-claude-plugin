// The question generator — ONE copy, shared by every surface that shows a
// customer their list: the free Baseline Kit, the post-checkout review, and the
// per-customer review page.
//
// It lived inside baseline-kit.html until 2026-09-19. It moved because the
// questions are now shown to a PAYING customer to approve before we spend ~$90
// measuring them, and two copies of a generator are two lists that drift.
//
// It is pure, synchronous string templating: no fetch, no model call, no wait.
// Given the inputs, ~100 questions exist immediately — which is what makes
// "show them the list at signup" possible at all.
//
// Inputs: { biz, city, what, products[], comps[], diff, domain, aliases[] }.
// REQUIRED are biz, city and what. Everything else sharpens the list; nothing
// else is needed for it to generate.
(function (root) {
  // ---- does a question name the business? ----
  // A question that contains the business's own name is answered with the business
  // by construction, so it can never sit in a named rate. Until 2026-10-01 this file
  // wrote eight of them graded winnable, and with eight in a 72-question list a
  // business no engine names on any buyer question would have printed about 11%.
  // Every reader that computes a rate (the report, the runner, the sample, the
  // Scorecard, the Kit) asks this one function, so a question a buyer types by
  // hand is caught the same way as one this file writes.
  //
  // The match is the WHOLE name or alias as a phrase, on lowercase words, so
  // punctuation, a possessive or an ampersand never hides it, and "Acme" never
  // matches "Acmeville". A legal suffix is dropped the way the tracked brand list
  // drops it (new-customer.mjs aliasesFor), because "Is Acme Plumbing any good?"
  // names Acme Plumbing LLC.
  var LEGAL_SUFFIX = /[\s,]+(?:l\.?l\.?c\.?|l\.?l\.?p\.?|p\.?l\.?l\.?c\.?|inc\.?|incorporated|corp\.?|corporation|co\.?|company|ltd\.?|limited|l\.?p\.?|p\.?c\.?)$/i;
  function words(s){
    return ' ' + String(s == null ? '' : s).normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
      .toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, ' ').trim() + ' ';
  }
  function businessNames(biz, aliases){
    var out = [], seen = {};
    function put(n){
      var w = words(n);
      // Two letters is the floor: a one-letter "name" would match every question.
      if (w.trim().length >= 2 && !seen[w]) { seen[w] = 1; out.push(String(n).trim()); }
    }
    [biz].concat(aliases || []).forEach(function(n){
      var t = String(n == null ? '' : n).trim();
      if (!t) return;
      put(t);
      for (var i = 0; i < 3 && LEGAL_SUFFIX.test(t); i++) t = t.replace(LEGAL_SUFFIX, '').trim();
      put(t);
    });
    return out;
  }
  function namesBusiness(text, names){
    var hay = words(text);
    return (names || []).some(function(n){
      var w = words(n);
      return w.trim().length >= 2 && hay.indexOf(w) !== -1;
    });
  }

  // ---- prompt generation ----
  // Cluster display names are built from the business's own words, so a finding
  // reads "0% in Cost, quotes and budget" instead of "0% in pain". Same grouping,
  // a label somebody can act on.
  var CLUSTER_ORDER = ['local','service','cost','choose','pain','trust','alternative','brand','intel'];

  function clusterNames(inp){
    return {
      local:       'Finding ' + withArticle(inp.what) + ' in ' + inp.city,
      service:     'Specific work: ' + (inp.products[0] || inp.what),
      cost:        'Cost, quotes and budget',
      choose:      'Choosing between providers',
      pain:        'Problems and urgent needs',
      trust:       'Trust, reviews and reputation',
      alternative: inp.comps[0] ? 'Alternatives to ' + inp.comps[0] : 'Alternatives and switching',
      brand:       'Asked about ' + inp.biz + ' by name',
      intel:       'Competitor intel (absence is fine here)'
    };
  }

  // Target ~100 questions, the same order of magnitude a paid engine runs. Every
  // line is a question a buyer could actually type; none is a permutation added
  // to reach a round number, which is why the count lands near 100 rather than on
  // it. TARGET caps a business with many products so the set stays readable.
  var TARGET = 100;

  function buildPrompts(inp){
    var what = inp.what, city = inp.city, biz = inp.biz;
    var prods = (inp.products && inp.products.length ? inp.products : [what]).slice(0, 4);
    var p1 = prods[0] || what, p2 = prods[1] || p1;
    var comps = inp.comps || [];
    var diff = inp.diff || '';
    var names = clusterNames(inp);
    var bizNames = businessNames(biz, inp.aliases);
    var all = [], seen = {};
    function add(cat, winnable, text){
      var key = text.toLowerCase().replace(/\s+/g, ' ').trim();
      if (seen[key]) return;
      // A counted question that happens to contain the business's name (a product
      // or a competitor typed with it) would be named by construction: it is left
      // out, never counted.
      if (winnable === 'yes' && namesBusiness(text, bizNames)) return;
      seen[key] = 1;
      all.push({ cat:cat, cluster:names[cat], winnable:winnable, text:text });
    }

    // 1 — local intent
    add('local','yes','Best ' + what + ' in ' + city);
    add('local','yes','Top ' + what + ' companies in ' + city);
    add('local','yes',cap(what) + ' near me in ' + city);
    add('local','yes','Who is the best ' + what + ' in ' + city + '?');
    add('local','yes','Recommended ' + what + ' in ' + city);
    add('local','yes','Highest rated ' + what + ' in ' + city);
    add('local','yes','Local ' + what + ' companies in ' + city + ' that are not national chains');
    add('local','yes','Small business ' + what + ' in ' + city);
    add('local','yes',cap(what) + ' companies serving ' + city + ' and the surrounding area');
    add('local','yes','Where do I find a good ' + what + ' in ' + city + '?');
    add('local','yes','Family owned ' + what + ' in ' + city);
    add('local','yes','Newest ' + what + ' companies in ' + city);
    if (diff) add('local','yes',cap(diff) + ' ' + what + ' in ' + city);
    if (diff) add('local','yes',cap(what) + ' in ' + city + ' that offer ' + diff);
    // The cap trims each category from its end, so the generic lines sit last and
    // the buyer's own differentiator is the last thing it would reach.
    add('local','yes','Can you recommend ' + withArticle(what) + ' in ' + city + '?');
    add('local','yes','Which ' + what + ' companies in ' + city + ' do people recommend most?');

    // 2 — the specific work, per product. Template by template across the products,
    // so when the cap trims from the end of this block every product keeps its
    // strongest questions; product by product, the last product vanished first.
    [
      function(pd){ return cap(pd) + ' in ' + city; },
      function(pd){ return 'Who does ' + pd + ' in ' + city + '?'; },
      function(pd){ return 'Best company for ' + pd + ' in ' + city; },
      function(pd){ return cap(pd) + ' services near ' + city; },
      function(pd){ return 'I need ' + pd + ' in ' + city + '. Where do I start?'; }
    ].forEach(function(t){ prods.forEach(function(pd){ add('service','yes',t(pd)); }); });

    // 3 — cost
    add('cost','yes','How much does ' + p1 + ' cost in ' + city + '?');
    add('cost','yes','Average price for ' + what + ' in ' + city);
    add('cost','yes','Affordable ' + p1 + ' for a small business in ' + city);
    add('cost','yes','Cheapest ' + what + ' in ' + city);
    add('cost','yes','Best value ' + what + ' in ' + city);
    add('cost','yes','Is ' + p1 + ' worth the money in ' + city + '?');
    add('cost','yes','How do I get a quote for ' + p1 + ' in ' + city + '?');
    add('cost','yes','What should I budget for ' + p1 + ' in ' + city + '?');
    add('cost','yes','Why is ' + p1 + ' so expensive in ' + city + '?');
    add('cost','yes',cap(what) + ' in ' + city + ' with transparent pricing');
    add('cost','yes','Free estimates for ' + p1 + ' in ' + city);
    add('cost','yes','Financing or payment plans for ' + p1 + ' in ' + city);

    // 4 — choosing
    add('choose','yes','How to choose ' + withArticle(what) + ' in ' + city);
    add('choose','yes','What should I look for in ' + withArticle(what) + '?');
    add('choose','yes','Questions to ask ' + withArticle(what) + ' before hiring');
    add('choose','yes','How do I compare ' + what + ' companies in ' + city + '?');
    add('choose','yes','Licensed and insured ' + what + ' in ' + city);
    add('choose','yes','Red flags when hiring ' + withArticle(what));
    add('choose','yes','Do I need a specialist for ' + p1 + ' or will any ' + what + ' do?');
    add('choose','yes','Who should I hire for ' + p1 + ' in ' + city + '?');
    add('choose','yes','Who do you recommend for ' + what + ' services in ' + city + '?');
    add('choose','yes','Which ' + what + ' in ' + city + ' handles commercial work?');
    add('choose','yes','Best ' + what + ' in ' + city + ' for a first-time customer');
    add('choose','yes','I need ' + p1 + ' in ' + city + ' on a tight budget. Who should I talk to?');
    add('choose','yes','I just moved to ' + city + '. Who should I use for ' + p1 + '?');

    // 5 — problems and urgency
    add('pain','yes','Emergency ' + what + ' in ' + city);
    add('pain','yes','Same day ' + what + ' in ' + city);
    add('pain','yes','24 hour ' + what + ' in ' + city);
    add('pain','yes','Weekend ' + what + ' in ' + city);
    add('pain','yes','My ' + p1 + ' failed. Who do I call in ' + city + '?');
    add('pain','yes','Fastest ' + what + ' in ' + city);
    add('pain','yes','Common ' + p1 + ' problems and who fixes them');
    add('pain','yes','How quickly can someone do ' + p1 + ' in ' + city + '?');
    add('pain','yes','What do I do if my ' + p1 + ' goes wrong?');
    add('pain','yes',cap(what) + ' in ' + city + ' that answer the phone after hours');
    add('pain','yes','Is ' + p2 + ' urgent or can it wait?');
    add('pain','yes','Who can do ' + p1 + ' this week in ' + city + '?');

    // 6 — trust
    add('trust','yes','Most trusted ' + what + ' in ' + city);
    add('trust','yes','Best reviewed ' + what + ' in ' + city);
    add('trust','yes',cap(what) + ' in ' + city + ' with the best reputation');
    add('trust','yes','Are there any ' + what + ' in ' + city + ' to avoid?');
    add('trust','yes','How do I check if ' + withArticle(what) + ' in ' + city + ' is legitimate?');
    add('trust','yes',cap(what) + ' in ' + city + ' with warranties or guarantees');
    add('trust','yes','Longest established ' + what + ' in ' + city);
    add('trust','yes',cap(what) + ' in ' + city + ' with certified technicians');
    add('trust','yes','Who has the best customer service for ' + what + ' in ' + city + '?');
    add('trust','yes','Award winning ' + what + ' in ' + city);
    add('trust','yes','Most experienced ' + what + ' in ' + city);

    // 7 — alternatives and switching, template by template for the same reason.
    add('alternative','yes','I am unhappy with my current ' + what + ' in ' + city + '. Who else is there?');
    add('alternative','yes','How do I switch ' + what + ' providers in ' + city + '?');
    [
      function(cp){ return 'Best alternatives to ' + cp + ' in ' + city; },
      function(cp){ return 'Who competes with ' + cp + ' in ' + city + '?'; },
      function(cp){ return 'Is there anyone better than ' + cp + ' in ' + city + '?'; },
      function(cp){ return cp + ' vs other ' + what + ' companies in ' + city; }
    ].forEach(function(t){ comps.slice(0, 3).forEach(function(cp){ add('alternative','yes',t(cp)); }); });

    // 8 — asked about the business by name. Graded `brand`: measured every pass,
    // counted toward the list the way intel is, and in no rate, because the engine
    // names the business by construction. Three, each for what only it can show:
    // whether the engine knows the business at all and which sites it reads to
    // describe it; the trust signals it reaches for; and one hard fact the owner
    // checks at a glance. An engine that has never heard of you and one that knows
    // you and recommends someone else need different fixes, and the buyer
    // questions cannot tell them apart.
    add('brand','brand','What do you know about ' + biz + ' in ' + city + '?');
    add('brand','brand','Is ' + biz + ' legitimate?');
    add('brand','brand','Who owns ' + biz + '?');

    // 9 — competitor intel. Flagged so the scoring never treats absence as a
    // failure: not being named in a question about a rival is the right answer.
    comps.slice(0, 3).forEach(function(cp){
      add('intel','intel',cp + ' reviews and reputation');
      add('intel','intel','Is ' + cp + ' expensive?');
      add('intel','intel','Problems with ' + cp);
    });

    return fit(all);
  }

  // The cap used to cut from the end of the list, which is where the competitor
  // questions sit: four products and three competitors gave 100 questions and no
  // intel at all. Questions held out of every rate (intel, brand) are kept whole;
  // the counted ones make room by losing the LAST question of whichever category
  // is largest, so no single topic is emptied and the order a buyer reads stays.
  function fit(all){
    var held = all.filter(function(q){ return q.winnable !== 'yes'; }).length;
    var room = Math.max(0, TARGET - held);
    var counted = all.filter(function(q){ return q.winnable === 'yes'; });
    var drop = counted.length - room;
    while (drop-- > 0){
      var size = {};
      counted.forEach(function(q){ size[q.cat] = (size[q.cat] || 0) + 1; });
      var big = Object.keys(size).sort(function(a, b){
        return size[b] - size[a] || CLUSTER_ORDER.indexOf(b) - CLUSTER_ORDER.indexOf(a);
      })[0];
      for (var i = counted.length - 1; i >= 0; i--){
        if (counted[i].cat === big){ counted[i].cut = true; counted.splice(i, 1); break; }
      }
    }
    var out = [], id = 0;
    all.forEach(function(q){
      if (q.cut) return;
      out.push({ id:++id, cat:q.cat, cluster:q.cluster, winnable:q.winnable, text:q.text });
    });
    return out;
  }
  function cap(s){ return s.charAt(0).toUpperCase() + s.slice(1); }
  // "a office furniture dealer" was the first line a paying customer read on their
  // own list (2026-09-30). A buyer types the article they would say, so the article
  // follows the sound of the next word: an electrician, a uniform supplier, a one-stop shop.
  function withArticle(w){
    var s = String(w || '');
    return (/^[aeiou]/i.test(s) && !/^(uni|use|usu|eu|one)/i.test(s) ? 'an ' : 'a ') + s;
  }
  root.NFPrompts = { buildPrompts: buildPrompts, clusterNames: clusterNames, CLUSTER_ORDER: CLUSTER_ORDER, TARGET: TARGET, cap: cap, withArticle: withArticle,
    businessNames: businessNames, namesBusiness: namesBusiness };
})(typeof window !== 'undefined' ? window : globalThis);
