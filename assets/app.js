(function(){"use strict";
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function shortAddr(a) { return a.length > 16 ? a.slice(0, 8) + "..." + a.slice(-6) : a; }

  function badgeFor(status) {
    var map = {
      "active": "ok", "ok": "ok", "success": "ok",
      "retrying": "warn", "quota-exhausted": "warn",
      "failed": "bad", "blocked": "bad",
      "pending": "pending", "attempt": "info", "tx": "ok"
    };
    return '<span class="badge ' + (map[status] || "info") + '">' + esc(status) + "</span>";
  }

  function money(n) { return "$" + Number(n || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}); }
  function loadPortfolio() {
    return fetch("data/paper-portfolio.json").then(function (r) { return r.json(); }).then(function (d) {
      var active = 0;
      function fm(n, pf) { return (pf.symbol || "") + Number(n || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}); }
      function render() {
        var pf = d.portfolios[active];
        document.getElementById("portfolio-title").textContent = pf.label;
        document.getElementById("portfolio-switch").innerHTML = d.portfolios.map(function (x, i) { return '<button class="portfolio-choice ' + (i === active ? 'active' : '') + '" data-pf="' + i + '">' + esc(x.currency) + ' portfolio</button>'; }).join("");
        document.querySelectorAll(".portfolio-choice").forEach(function(btn){ btn.addEventListener("click",function(){active=Number(btn.dataset.pf);render();}); });
        var invested = pf.positions.reduce(function (sum, p) { return sum + Number(p.market_value || 0); }, 0);
        var equity = Number(pf.cash || 0) + invested, gain = equity - Number(pf.starting_cash || 0), gainPct = gain / Number(pf.starting_cash) * 100;
        document.getElementById("portfolio-stats").innerHTML = [["Portfolio value",fm(equity,pf)],["Cash",fm(pf.cash,pf)],["Total gain/loss",(gain >= 0 ? "+" : "") + fm(gain,pf) + " (" + gainPct.toFixed(2) + "%)"],["Stretch target",fm(pf.target,pf) + " by " + esc(pf.target_date)]].map(function(x){return '<div class="stat"><span>'+x[0]+'</span><strong>'+x[1]+'</strong></div>';}).join("");
        document.getElementById("target-note").textContent = pf.target_note;
        document.getElementById("pricing-note").textContent = pf.pricing_note + " Updated: " + new Date(d.updated_at).toLocaleString();
        document.querySelector("#positions tbody").innerHTML = pf.positions.map(function(p){var pl=Number(p.unrealized_pl||0),cls=pl>0?"gain":pl<0?"loss":"";return "<tr><td><strong>"+esc(p.symbol)+"</strong><span class=\"status-note\">"+esc(p.name)+"</span></td><td>"+esc(Number(p.qty).toFixed(6))+"</td><td>"+fm(p.avg_price,pf)+"</td><td><a href=\""+esc(p.source_url)+"\" target=\"_blank\" rel=\"noopener\">"+fm(p.last_price,pf)+"</a><span class=\"status-note\">"+esc(p.price_as_of)+"</span></td><td>"+fm(p.market_value,pf)+"</td><td class=\""+cls+"\">"+(pl>=0?"+":"")+fm(pl,pf)+"</td><td>"+esc(p.risk)+"</td></tr>";}).join("");
        document.querySelector("#transactions tbody").innerHTML = pf.transactions.slice().sort(function(a,b){return a.ts<b.ts?1:-1;}).map(function(t){return "<tr><td>"+esc(t.ts.replace("T"," ").replace("Z",""))+"</td><td>"+badgeFor(t.side==="BUY"?"success":"warn")+"</td><td><strong>"+esc(t.symbol)+"</strong></td><td>"+esc(Number(t.qty).toFixed(6))+"</td><td>"+fm(t.price,pf)+"</td><td>"+fm(t.notional,pf)+"</td><td>"+esc(t.reason)+"</td></tr>";}).join("");
      }
      render();
    });
  }
loadPortfolio().then(function(){document.getElementById("updated").textContent="Data last updated: "+new Date().toLocaleString();}).catch(console.error);
})();
