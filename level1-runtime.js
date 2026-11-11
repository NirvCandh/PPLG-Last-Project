// Runs once per frame as a GDevelop JavaScript event. World objects remain editable.
const s = runtimeScene;
const pulseCue=.48, interactCue=.69, hurtCue=.42;
if (!s._cq) {
  const componentArt = /* COMPONENT_ART_DATA */ {};
  const npcPortraits = /* NPC_PORTRAIT_DATA */ {};
  const sensorNames=['DHT22','LDR','Soil','PIR'];
  const icon = (name,size=40) => componentArt[name]?`<img class="cq-art" src="${componentArt[name]}" alt="${name}" draggable="false" style="width:${size}px;height:${size}px">`:'';
  // A 28px nine-slice frame keeps the stepped corners square as the panel resizes.
  const dialogueCorner = '<path fill="#412b28" d="M0 12V5h2V2h3V0h7v3H7v2H5v2H3v5z"/><path fill="#dec088" d="M1 12V6h2V3h3V1h6v1H7v2H5v1H4v2H2v5z"/><path fill="#755137" d="M4 12V8h2V6h2V4h4v1H9v2H7v2H5v3z"/><path fill="#f0d6a4" d="M7 8h1V7h2v1h1v2h-1v1H8v-1H7z"/><path fill="#b38a55" d="M8 8h2v2H8z"/>';
  const dialogueBorder = encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28" shape-rendering="crispEdges"><path fill="#0c1224" d="M3 0H25V2h1v3h2v18h-2v3h-1v2H3v-2H2v-3H0V5h2V2h1z"/><path fill="#412b28" d="M12 0h4v3h-4zM12 25h4v3h-4zM0 12h3v4H0zM25 12h3v4h-3z"/><path fill="#dec088" d="M12 1h4v1h-4zM12 26h4v1h-4zM1 12h1v4H1zM26 12h1v4h-1z"/><path fill="#755137" d="M12 4h4v1h-4zM12 23h4v1h-4zM4 12h1v4H4zM23 12h1v4h-1z"/>${dialogueCorner}<g transform="translate(28 0) scale(-1 1)">${dialogueCorner}</g><g transform="translate(0 28) scale(1 -1)">${dialogueCorner}</g><g transform="translate(28 28) scale(-1 -1)">${dialogueCorner}</g></svg>`);
  const old = document.getElementById('cq-ui');
  if (old) {old._cqDispose?.();old.remove();}
  const root = document.createElement('div'); root.id = 'cq-ui';
  root.innerHTML = `<style>
  #cq-ui{
    --cq-frame:url("data:image/svg+xml,${dialogueBorder}");--night:#0c1224;--plate:#141d32;--brown:#735039;
    --gold:#dec088;--cream:#fbf2df;--quiet:#bcb4a4;--teal:#83dac5;--rose:#f2a58c;
    position:fixed;inset:0;container-type:size;overflow:hidden;pointer-events:none;z-index:1000;
    color:var(--cream);font:18px/1.3 'Pixelify Sans',monospace;
  }
  #cq-ui *{box-sizing:border-box}
  #cq-ui :is(button,select,input){font:inherit}
  #cq-ui .cq-art{display:inline-block;object-fit:contain;image-rendering:pixelated;vertical-align:middle;flex-shrink:0}
  #cq-ui .cq-frame{border:20px solid transparent;border-image:var(--cq-frame) 12 fill stretch;image-rendering:pixelated}
  #cq-ui :is(button,select){
    border:1px solid #9b764b;border-radius:0;background:#222940;color:var(--cream);
    box-shadow:inset 0 2px #3a4052,inset 0 -3px #0a1020;padding:.42em .76em;
  }
  #cq-ui button{pointer-events:auto;cursor:pointer;min-height:34px;line-height:1.2}
  #cq-ui button:is(:hover,:focus-visible){background:#34384a;border-color:var(--gold);color:#fff6d8}
  #cq-ui button:focus-visible,#cq-ui :is(select,input):focus-visible{outline:2px solid var(--gold);outline-offset:2px}
  #cq-ui button:active{transform:translateY(1px);box-shadow:inset 0 2px #11162a}
  #cq-ui button:disabled{background:#161b2a;color:#a69d8e;border-color:#56473b;cursor:default;box-shadow:none;transform:none}
  #cq-ui .primary{background:#d9b16e;color:#1c1724;border-color:#f4d8a0;box-shadow:inset 0 2px #f6dc9e,inset 0 -3px #a27747;font-weight:700}
  #cq-ui .primary:is(:hover,:focus-visible){background:#f0ce8a;color:#201725}
  #cq-ui .tag{display:block;color:var(--gold);font-size:.72em;font-weight:700;letter-spacing:.13em}
  #cq-ui :is(h1,h2,p){margin:0}
  #cq-ui h1{font-size:clamp(37px,6cqw,74px);font-weight:700;line-height:.88;letter-spacing:-.045em;text-shadow:0 4px #5b392c}
  #cq-ui h2{font-size:clamp(22px,3.5cqw,39px);line-height:1.06;color:var(--cream)}
  #cq-ui p{color:var(--quiet);line-height:1.3}
  #cq-ui .muted{font-size:.78em;color:var(--quiet)}
  #cq-ui .row{display:flex;gap:9px;flex-wrap:wrap;align-items:center}
  #cq-ui .key{display:inline-block;min-width:1.4em;padding:0 .27em;border:1px solid #816446;color:#f6d59a;background:#101729;text-align:center;font:inherit;font-size:.84em}
  #cq-ui .pass{color:var(--teal)} #cq-ui .fail{color:var(--rose)}
  #cq-ui .stack{display:grid;gap:clamp(8px,1.45cqw,18px)}
  #cq-ui .rune{display:inline-block;width:12px;height:12px;background:var(--gold);clip-path:polygon(34% 0,66% 0,66% 17%,83% 17%,83% 34%,100% 34%,100% 66%,83% 66%,83% 83%,66% 83%,66% 100%,34% 100%,34% 83%,17% 83%,17% 66%,0 66%,0 34%,17% 34%,17% 17%,34% 17%)}
  #cq-modal{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:#0609159e;pointer-events:auto;padding:8px}
  #cq-ui .card{
    position:relative;width:min(93%,680px);max-height:100%;overflow:auto;overscroll-behavior:contain;
    padding:clamp(9px,2.2cqw,26px);scrollbar-width:thin;scrollbar-color:#916b46 var(--night);outline:none;
  }
  #cq-ui .cq-title{width:min(94%,1000px);padding:clamp(14px,3cqw,36px)}
  #cq-ui .title-grid{display:grid;grid-template-columns:minmax(0,1.28fr) minmax(175px,.72fr);align-items:center;gap:clamp(18px,4cqw,52px)}
  #cq-ui .title-lockup{min-width:0;gap:clamp(9px,2cqw,22px)}
  #cq-ui .title-lockup h1{font-size:clamp(46px,7.5cqw,92px)}
  #cq-ui .title-lockup h1 span{color:#f2ce8b}
  #cq-ui .title-rule{display:flex;align-items:center;gap:8px;color:var(--gold)}
  #cq-ui .title-rule::after{content:'';height:1px;flex:1;background:#745237}
  #cq-ui .title-emblem{display:flex;align-items:center;gap:9px;color:var(--teal)}
  #cq-ui .title-emblem i{width:6px;height:6px;background:currentColor;box-shadow:10px 0 #365e59,20px 0 #293e47;animation:cq-signal 1.8s steps(2,end) infinite}
  @keyframes cq-signal{50%{opacity:.35}}
  #cq-ui .menu-actions{display:grid;gap:8px}
  #cq-ui .menu-actions button{text-align:left;display:flex;align-items:center;gap:.65em}
  #cq-ui .menu-actions button::before{content:'';width:10px;height:12px;background:currentColor;opacity:0;clip-path:polygon(0 0,34% 0,34% 17%,67% 17%,67% 34%,100% 34%,100% 66%,67% 66%,67% 83%,34% 83%,34% 100%,0 100%)}
  #cq-ui .menu-actions button:is(:hover,:focus-visible)::before{opacity:1}
  #cq-ui .title-nav{border-left:1px dashed #75563d;padding-left:clamp(12px,2cqw,24px)}
  #cq-ui .cq-pause{width:min(90%,420px)}
  #cq-ui .cq-defeat{width:min(92%,520px)}
  #cq-ui .cq-defeat :is(.tag,h2){color:var(--rose)}
  #cq-ui .cq-defeat .result-crest{color:var(--rose);filter:grayscale(.5)}
  #cq-ui .result-crest{display:flex;align-items:center;gap:9px;color:var(--gold)}
  #cq-ui .cq-victory .rune{animation:cq-signal 2.4s steps(2,end) infinite}
  #cq-ui .result-crest .cq-art{border:1px solid #7d603e;background:#141d32;padding:3px}
  #cq-ui .reading-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:5px}
  #cq-ui .reading{display:grid;gap:4px;padding:8px 6px;background:var(--plate);border-top:2px solid #8e6c48;text-align:center;overflow-wrap:anywhere}
  #cq-ui .reading b{color:var(--teal);font-size:1.03em}
  #cq-ui .settings-row{display:grid;grid-template-columns:1fr minmax(120px,42%);gap:10px;align-items:center;border-top:1px solid #614a39;padding:8px 0}
  #cq-ui .settings-row small{display:block;color:var(--quiet);font-size:.78em}
  #cq-ui :is(input[type=range],input[type=checkbox]){pointer-events:auto;cursor:pointer;appearance:none;border-radius:0}
  #cq-ui input[type=range]{height:14px;width:100%;margin:0;border:1px solid #967248;background:#171c2d;box-shadow:inset 0 3px #090e1a}
  #cq-ui input[type=range]::-webkit-slider-thumb{appearance:none;width:14px;height:20px;border:2px solid #f0d5a2;background:#ac824e;box-shadow:inset 2px 0 #dfb774}
  #cq-ui input[type=range]::-moz-range-thumb{width:12px;height:18px;border:2px solid #f0d5a2;border-radius:0;background:#ac824e}
  #cq-ui input[type=checkbox]{width:40px;height:20px;margin:0;border:1px solid #967248;background:#1a2030;justify-self:start}
  #cq-ui input[type=checkbox]::before{content:'';display:block;width:14px;height:14px;margin:2px;background:#ad977d}
  #cq-ui input[type=checkbox]:checked{background:#28584e}
  #cq-ui input[type=checkbox]:checked::before{transform:translateX(20px);background:#a3e4bf}
  #cq-ui .control-list{display:grid;grid-template-columns:auto 1fr;gap:5px 10px;margin:0}
  #cq-ui .control-list dd{margin:0;color:var(--quiet)}
  #cq-ui .kit-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}
  #cq-ui .kit-item{display:grid;justify-items:center;align-content:start;gap:6px;text-align:center;border:1px solid #8e6c48;background:var(--plate);padding:10px 4px}
  #cq-ui .kit-item small{color:var(--teal);font-size:.75em}
  #cq-ui .kit-item.missing .cq-art{filter:grayscale(1);opacity:.42}
  #cq-ui .kit-item.missing small{color:var(--quiet)}
  #cq-ui .kit-footer{display:flex;gap:8px;flex-wrap:wrap}
  #cq-ui .kit-footer span{padding:4px 8px;background:#171e30;border-left:2px solid #8e6c48}
  #cq-ui .cq-workbench{width:min(94%,850px)}
  #cq-ui :is(.cq-workbench,.cq-settings,.cq-about){display:grid;grid-template-rows:minmax(0,1fr) auto;gap:8px;overflow:hidden}
  #cq-ui .screen-body{min-height:0;overflow:auto;overscroll-behavior:contain;padding:0 5px 3px;scrollbar-width:thin;scrollbar-color:#916b46 var(--night)}
  #cq-ui .screen-footer{display:grid;gap:6px;padding-top:7px;border-top:1px solid #876246}
  #cq-ui #assembly-feedback{max-height:clamp(28px,10cqh,70px);overflow:auto;font-size:.84em}
  #cq-ui #assembly-feedback:empty{display:none}
  #cq-ui .chip,#cq-ui .slot{display:inline-flex;align-items:center;gap:5px}
  #cq-ui .chip{cursor:grab}
  #cq-ui .chip[aria-pressed=true],#cq-ui .slot[data-placed]{border-color:var(--teal);background:#193534}
  #cq-ui .sensor{display:grid;grid-template-columns:minmax(120px,.75fr) minmax(0,1.6fr);gap:6px 10px;align-items:center;padding:7px;background:#141c2e;border-left:2px solid #876246}
  #cq-ui .sensor small{grid-column:2;color:var(--quiet);font-size:.72em}
  #cq-ui .sockets{display:flex;align-items:center;gap:5px;flex-wrap:wrap}
  #cq-ui .sockets label{display:grid;font-size:.76em;color:var(--gold)}
  #cq-ui select{pointer-events:auto;appearance:none;max-width:100%;padding:3px 16px 3px 5px;color:var(--cream);background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='9' height='5' shape-rendering='crispEdges'%3E%3Cpath fill='%23dec088' d='M0 0H9V1H8V2H7V3H6V4H5V5H4V4H3V3H2V2H1V1H0Z'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 4px center}
  #cq-ui select[data-result=ok]{border-color:var(--teal)} #cq-ui select[data-result=error]{border-color:var(--rose)}
  #cq-hud{display:flex;justify-content:space-between;align-items:flex-start;gap:8px;padding:clamp(5px,1.2cqw,16px);font-size:clamp(12px,1.35cqw,17px)}
  #cq-ui:not([data-playing]) #cq-hud{visibility:hidden}
  #cq-hud .hudbox{padding:3px 7px;min-width:0;display:grid;gap:4px}
  #cq-hud .hud-tag{display:flex;align-items:center;gap:6px;justify-content:space-between;color:var(--gold);font-size:.72em;font-weight:700;letter-spacing:.07em;white-space:nowrap}
  #cq-stats{display:flex;gap:3px;align-items:center}
  #cq-stats [data-empty]{filter:grayscale(1);opacity:.38}
  #cq-stats .cq-art{width:clamp(11px,1.85cqw,23px)!important;height:clamp(11px,1.85cqw,23px)!important}
  #cq-energy{display:grid;grid-template-columns:repeat(10,minmax(0,1fr));gap:2px;padding:2px;background:#070c18;border:1px solid #88633f}
  #cq-energy>span{height:clamp(4px,.65cqw,8px);background:#202b3e}
  #cq-energy i{display:block;height:100%;width:0;background:#72d1b8;box-shadow:inset 0 -2px #367e76}
  #cq-hud .hud-slots{display:flex;align-items:center;gap:3px}
  #cq-hud .hud-slot{display:grid;place-items:center;border:1px solid #514736;background:#151c2c;padding:2px}
  #cq-hud .hud-slot[data-collected]{border-color:#a08154;background:#253436}
  #cq-hud .hud-slot:not([data-collected]) .cq-art{filter:grayscale(1);opacity:.45}
  #cq-hud .hud-slot .cq-art{width:clamp(10px,1.8cqw,23px)!important;height:clamp(10px,1.8cqw,23px)!important}
  #cq-hud .hud-tools{display:flex;gap:4px;align-items:center;flex-shrink:0}
  #cq-hud .hud-tools button{font-size:.8em;min-height:29px;padding:.34em .52em;white-space:nowrap}
  #cq-hud .hud-pulse{display:flex;align-items:center;gap:4px;border:1px solid #a18154;background:#142739;padding:2px 4px;color:#a9e4d3}
  #cq-hud .hud-pulse[data-state=loading]{color:var(--gold)}
  #cq-hud .hud-pulse[data-state=empty]{color:#bdb1a3;border-color:#594a3b}
  #cq-hud .hud-pulse[data-state=empty] .cq-art{filter:grayscale(1);opacity:.5}
  #cq-tip{position:absolute;bottom:clamp(8px,2cqh,19px);left:50%;transform:translateX(-50%);text-align:center;width:max-content;max-width:90%;padding:2px 7px;font-size:clamp(12px,1.48cqw,18px);color:var(--cream)}
  #cq-tip span{display:block;color:var(--gold)}
  #cq-tip :empty{display:none}
  #cq-ui[data-modal] :is(#cq-tip,#cq-touch),#cq-ui[data-dialogue] :is(#cq-tip,#cq-touch){visibility:hidden}
  #cq-touch{display:none;position:absolute;bottom:clamp(44px,11cqh,86px);left:9px;right:9px;justify-content:space-between}
  #cq-touch button{opacity:.93;touch-action:none;min-width:40px;min-height:36px}
  #cq-touch .pad-arrow{display:inline-block;width:12px;height:8px;background:currentColor;clip-path:polygon(0 0,100% 0,100% 25%,84% 25%,84% 50%,67% 50%,67% 75%,58% 75%,58% 100%,42% 100%,42% 75%,33% 75%,33% 50%,16% 50%,16% 25%,0 25%)}
  #cq-touch [data-hold=Left] .pad-arrow{transform:rotate(90deg)}
  #cq-touch [data-hold=Right] .pad-arrow{transform:rotate(-90deg)}
  #cq-touch [data-hold=Up] .pad-arrow{transform:rotate(180deg)}
  @media(pointer:coarse){#cq-touch{display:flex}}
  #cq-ui[data-reduce-motion] :is(.title-emblem i,.cq-victory .rune,.dialogue-arrow){animation:none!important}
  @media(prefers-reduced-motion:reduce){#cq-ui :is(.title-emblem i,.cq-victory .rune){animation:none}}
  @container (max-width:720px){
    #cq-ui .cq-frame{border-width:12px}
    #cq-ui .card{font-size:15px}
    #cq-ui .title-nav{padding-left:12px}
    #cq-hud{gap:5px} #cq-hud .hudbox{padding:2px 3px;gap:3px}
    #cq-hud .hud-pulse .pulse-name{display:none}
    #cq-hud .hud-tools button{min-height:26px}
    #cq-touch .row{gap:4px}
  }
  @container (max-width:520px){
    #cq-ui .cq-frame{border-width:10px}
    #cq-ui .title-grid{grid-template-columns:1fr;gap:13px}
    #cq-ui .title-nav{border-left:0;border-top:1px dashed #75563d;padding:10px 0 0}
    #cq-ui .title-lockup h1{font-size:47px}
    #cq-ui .menu-actions{gap:5px}
    #cq-ui .card{padding:8px}
    #cq-ui .kit-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
    #cq-ui .kit-item .cq-art{max-width:44px;max-height:44px}
    #cq-ui .reading-grid{grid-template-columns:repeat(3,minmax(0,1fr))}
    #cq-ui .sensor{grid-template-columns:1fr}
    #cq-ui .sensor small{grid-column:1}
    #cq-hud .hud-tools{gap:3px}
    #cq-hud .hud-tools button{font-size:11px;padding:3px 4px}
    #cq-hud .hud-pulse .cq-art{width:15px!important;height:15px!important}
    #cq-touch button{min-width:31px;min-height:29px;font-size:12px;padding:4px 5px}
  }
  @container (max-width:520px) and (max-height:270px){
    #cq-ui .title-grid{grid-template-columns:1fr 1fr;gap:9px}
    #cq-ui .title-nav{border-top:0;border-left:1px dashed #75563d;padding:0 0 0 7px}
    #cq-ui .title-lockup{gap:6px}
    #cq-ui .title-lockup h1{font-size:clamp(28px,9cqw,42px)}
    #cq-ui .title-lockup :is(p,.title-rule .rune){display:none}
    #cq-ui .title-emblem .cq-art{width:27px!important;height:27px!important}
    #cq-ui .cq-title .menu-actions button{min-height:25px;font-size:12px;padding:3px 4px}
  }
  @font-face{font-family:'Pixelify Sans';font-weight:400 700;font-display:swap;src:url('data:font/woff2;base64,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') format('woff2')}
  #cq-ui{container-type:size;overflow:hidden}
  #cq-ui .card{max-height:94%}
  #cq-hud>.row{flex-shrink:0}
  #cq-ui .chip[aria-pressed="true"]{border-color:#fff}
  #cq-tip:empty{display:none}
  #cq-ui[data-modal] :is(#cq-tip,#cq-touch){visibility:hidden}
  @container (max-width:720px){
    #cq-hud{align-items:flex-start;padding:7px;gap:6px;font-size:12px}
    #cq-ui .hudbox{min-width:0;padding:6px 8px}
    #cq-hud button{padding:7px 9px;font-size:12px}
    #cq-ui .tag{font-size:10px;letter-spacing:1.5px}
    #cq-ui #cq-stats .cq-art{max-width:15px;max-height:15px;margin-right:0}
    #cq-tip{bottom:8px;padding:6px 11px;font-size:11px}
    #cq-touch{bottom:50px}
  }
  @container (max-width:440px){
    #cq-ui .card{padding:12px;font-size:12px}
    #cq-ui .card h1{font-size:32px}
    #cq-ui .card h2{font-size:19px}
    #cq-ui .card button{padding:7px 9px;font-size:12px}
    #cq-ui .sensor{grid-template-columns:1fr}
    #cq-touch{left:5px;right:5px;gap:6px}
    #cq-ui #cq-touch .row{gap:3px}
    #cq-ui #cq-touch button{min-width:31px;padding:6px;font-size:11px}
  }
  #cq-dialogue{position:absolute;inset:0;container-type:size;overflow:hidden;pointer-events:auto}
  #cq-ui [hidden]{display:none!important}
  #cq-ui[data-dialogue] :is(#cq-touch,#cq-tip){visibility:hidden}
  #cq-dialogue .dialogue-panel{
    --gold:#dec088;--navy:#0c1224;--ink:#fbf2df;
    --frame:var(--cq-frame);
    --portrait-column:23cqw;--portrait-size:min(40cqw,83cqh);--name-overlap:clamp(6px,1.1cqw,15px);
    position:absolute;inset:auto 2.5cqw 4.8cqh;height:max(23.5cqh,min(32cqh,108px));
    color:var(--ink);font:clamp(13px,2cqw,26px)/1.24 'Pixelify Sans',monospace;outline:none;
  }
  #cq-dialogue .dialogue-frame{
    position:absolute;inset:0;pointer-events:none;
    border:clamp(12px,1.9cqw,24px) solid transparent;border-image:var(--frame) 12 fill stretch;image-rendering:pixelated;
  }
  #cq-dialogue .dialogue-portrait{
    position:absolute;bottom:calc(-1 * var(--name-overlap));left:1.2cqw;width:var(--portrait-column);
    height:calc(min(36cqh,29cqw) + var(--name-overlap));
    overflow:hidden;pointer-events:none;
  }
  #cq-dialogue .dialogue-portrait::before{
    content:'';position:absolute;bottom:5%;left:9%;right:9%;height:52%;
    border:clamp(8px,1cqw,13px) solid transparent;border-image:var(--frame) 12 fill stretch;opacity:.7;
  }
  #cq-dialogue .dialogue-portrait img{
    position:absolute;left:50%;top:0;width:var(--portrait-size);height:var(--portrait-size);
    transform:translate(-50%,-12%);image-rendering:pixelated;
    filter:drop-shadow(-2px 0 #151520) drop-shadow(2px 2px #151520);
  }
  #cq-dialogue .dialogue-name{
    position:absolute;bottom:calc(-1 * var(--name-overlap));left:2.4cqw;width:calc(var(--portrait-column) - 2.4cqw);
    padding:clamp(5px,.9cqw,12px) 0;min-height:28px;text-align:center;display:grid;place-items:center;
    color:#f9dfa9;font-size:clamp(13px,2.2cqw,29px);font-weight:700;line-height:1;letter-spacing:.035em;
  }
  #cq-dialogue .dialogue-name .dialogue-frame{border-width:clamp(10px,1.3cqw,17px)}
  #cq-dialogue .dialogue-name strong{position:relative}
  #cq-dialogue .dialogue-content{
    position:absolute;inset:clamp(10px,1.8cqw,23px) clamp(12px,2.3cqw,30px) clamp(7px,1.15cqw,15px) calc(var(--portrait-column) + 2.5cqw);
    display:grid;grid-template-rows:minmax(0,1fr) auto;gap:4px;
  }
  #cq-dialogue .dialogue-copy{overflow:auto;overflow-wrap:anywhere;scrollbar-width:thin;scrollbar-color:#87664a var(--navy)}
  #cq-dialogue .dialogue-line{color:inherit;font:inherit;white-space:pre-line;margin:0}
  #cq-dialogue .dialogue-untyped{visibility:hidden}
  #cq-dialogue .dialogue-feedback{color:#f2c087;font-size:.78em;margin:.2em 0 0;line-height:1.2}
  #cq-dialogue .dialogue-footer{display:flex;justify-content:flex-end;align-items:end}
  #cq-dialogue button{
    padding:.2em .52em;border:1px solid #866442;border-radius:0;background:#182137;color:var(--ink);
    font:inherit;font-size:.76em;line-height:1.24;white-space:nowrap;transition:none;
  }
  #cq-dialogue button:is(:hover,:focus-visible){background:#283046;border-color:var(--gold);color:#fff5d6}
  #cq-dialogue button:focus-visible{outline:2px solid var(--gold);outline-offset:2px}
  #cq-dialogue .dialogue-next{display:flex;align-items:center;gap:.5em;border-color:transparent;background:transparent;box-shadow:none;color:var(--gold)}
  #cq-dialogue .dialogue-key{font:inherit;border:1px solid #866442;color:#f3deb2;padding:0 .26em}
  #cq-dialogue .dialogue-arrow{width:14px;height:8px;background:currentColor;clip-path:polygon(0 0,100% 0,100% 25%,86% 25%,86% 50%,71% 50%,71% 75%,57% 75%,57% 100%,43% 100%,43% 75%,29% 75%,29% 50%,14% 50%,14% 25%,0 25%)}
  #cq-dialogue .dialogue-next[data-ready] .dialogue-arrow{animation:cq-dialogue-arrow 1s steps(1,end) infinite}
  @keyframes cq-dialogue-arrow{50%{transform:translateY(2px);opacity:.55}}
  #cq-dialogue .dialogue-choices{display:flex;gap:clamp(3px,.65cqw,9px);flex-wrap:wrap;justify-content:flex-end}
  #cq-dialogue .dialogue-reader{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%)}
  @media(pointer:coarse){#cq-dialogue .dialogue-key{display:none}#cq-dialogue button{min-height:28px}}
  @media(prefers-reduced-motion:reduce){#cq-dialogue .dialogue-arrow{animation:none!important}}
  @container (max-width:560px){
    #cq-dialogue .dialogue-panel{--portrait-column:24cqw;height:max(23.5cqh,min(35cqh,124px))}
    #cq-dialogue .dialogue-name{left:1.2cqw;width:var(--portrait-column);letter-spacing:0}
  }
  </style>
  <div id="cq-hud">
    <section class="hudbox cq-frame" aria-label="Status Nova">
      <div class="hud-tag"><span>NOVA · 01</span><span id="cq-hp"></span></div>
      <div id="cq-stats" role="img">${Array.from({length:5},()=>`<span>${icon('Heart',23)}</span>`).join('')}</div>
      <div class="hud-tag"><span>ENERGI</span><span id="cq-energy-value"></span></div>
      <div id="cq-energy" role="meter" aria-label="Energi" aria-valuemin="0" aria-valuemax="100">${'<span><i></i></span>'.repeat(10)}</div>
    </section>
    <section class="hudbox cq-frame" aria-label="Sensor terkumpul">
      <div class="hud-tag"><span>SENSOR</span><span id="cq-count"></span></div>
      <div class="hud-slots">${sensorNames.map(n=>`<span class="hud-slot" data-sensor="${n}" title="${n}">${icon(n,23)}</span>`).join('')}</div>
    </section>
    <section class="hudbox cq-frame" aria-label="Peralatan dan menu">
      <div class="hud-tools">
        <div class="hud-pulse" id="cq-pulse" title="Pulse Wave · 5 energi">${icon('Pulse',22)}<span class="pulse-name">PULSE</span><kbd class="key">J</kbd></div>
        <button id="cq-inventory" type="button" aria-label="Inventory (I)">KIT <span class="key" aria-hidden="true">I</span></button>
        <button id="cq-pause" type="button" aria-label="Jeda (Esc)">II</button>
      </div>
    </section>
  </div>
  <div id="cq-tip" class="cq-frame" hidden><div id="cq-prompt"></div><span id="cq-message" role="status"></span></div>
  <div id="cq-touch"><div class="row"><button data-hold="Left" aria-label="Kiri"><span class="pad-arrow"></span></button><button data-hold="Right" aria-label="Kanan"><span class="pad-arrow"></span></button><button data-hold="Up" aria-label="Naik"><span class="pad-arrow"></span></button><button data-hold="Down" aria-label="Turun"><span class="pad-arrow"></span></button></div><div class="row"><button data-hold="Space">Lompat</button><button data-hold="j">Pulse</button><button data-hold="e" aria-label="Interaksi">E</button></div></div>
  <div id="cq-modal"></div>
  <div id="cq-dialogue" hidden>
    <section class="dialogue-panel" role="dialog" aria-modal="true" aria-labelledby="cq-speaker" tabindex="-1">
      <div class="dialogue-frame" aria-hidden="true"></div>
      <div class="dialogue-portrait"><img data-npc-portrait alt="" draggable="false"></div>
      <div class="dialogue-name"><span class="dialogue-frame" aria-hidden="true"></span><strong id="cq-speaker"></strong></div>
      <div class="dialogue-content">
        <div class="dialogue-copy">
          <p class="dialogue-line" aria-hidden="true"><span class="dialogue-typed"></span><span class="dialogue-untyped"></span></p>
          <p class="dialogue-feedback" role="status" hidden></p>
          <span class="dialogue-reader" aria-live="polite"></span>
        </div>
        <div class="dialogue-footer">
          <button class="dialogue-next" type="button"><kbd class="dialogue-key" aria-hidden="true">E</kbd><span class="dialogue-action"></span><span class="dialogue-arrow" aria-hidden="true"></span></button>
          <div class="dialogue-choices" hidden></div>
        </div>
      </div>
    </section>
  </div>`;
  document.body.appendChild(root);
  const game=s.getGame(),renderer=game.getRenderer(),canvas=renderer.getCanvas();
  const options=game._cqUiOptions??={textSpeed:44,reduceMotion:false};
  root.toggleAttribute('data-reduce-motion',options.reduceMotion);
  if(canvas){
    const fitUi=()=>{
      const {left,top,width,height}=canvas.getBoundingClientRect();
      if(width&&height)Object.assign(root.style,{inset:`${top}px auto auto ${left}px`,width:`${width}px`,height:`${height}px`});
    };
    fitUi();
    const observer=new ResizeObserver(fitUi);
    observer.observe(canvas);
    window.addEventListener('resize',fitUi);
    root._cqDispose=()=>{observer.disconnect();window.removeEventListener('resize',fitUi);};
  }
  const c = s._cq = {root,t:0,wall:0,hp:5,energy:100,inv:{},power:false,modal:true,face:1,invuln:0,cooldown:0,prev:{},touch:{},message:'',until:0,checkpoint:[160,518],started:false,dead:false,attackUntil:0,interactUntil:0,voltUntil:0,voltMood:'Hover',jumpQueuedUntil:0};
  c.$ = q => root.querySelector(q);
  c.icon=icon;
  c.npcFrames=npcPortraits;
  c.player = s.getObjects('Nova')[0]; c.beh = c.player.getBehavior('Platformer');
  const modal = c.$('#cq-modal'), dialogueView = c.$('#cq-dialogue');
  const dialoguePanel = c.$('.dialogue-panel'), dialogueCopy = c.$('.dialogue-copy');
  const dialogueNext = c.$('.dialogue-next'), dialogueChoices = c.$('.dialogue-choices');
  const dialogueFeedback = c.$('.dialogue-feedback');
  const speakers = {Ohm:'Prof. Ohm', Warga:'Penjaga Kebun'};
  const playModalCue = () => {
    c.jumpQueuedUntil=0;
    if(c.started&&!c.dead){c.interactUntil=c.wall+interactCue;c.voltMood='Speak';c.voltUntil=c.wall+3;}
  };
  const hideDialogue = () => {
    if(dialogueView.contains(document.activeElement)){
      document.activeElement.blur();
      s.getGame().getRenderer().getCanvas()?.focus({preventScroll:true});
    }
    dialogueView.hidden=true;
    delete root.dataset.dialogue;
    c.$('#cq-hud').inert=false;
    c.dialogue=null;
    c.npcSpeaker='';
  };
  c.say = (text,duration=5) => {c.message=text;c.until=c.t+duration;c.voltMood='Hint';c.voltUntil=c.wall+Math.min(duration,3);};
  c.close = () => {
    if(c.dead)return;
    if(modal.contains(document.activeElement)){
      document.activeElement.blur();
      canvas?.focus({preventScroll:true});
    }
    modal.style.display='none';delete root.dataset.modal;c.modal=false;hideDialogue();
  };
  // DOM button callbacks run between GDevelop frames. Consume the request in the scene event.
  c.restart = () => {c.restartRequested=true;};
  c.open = (html,{screen='panel',back=c.close}={}) => {
    hideDialogue();
    c.modal=true;
    c.modalBack=back;
    root.dataset.modal=screen;
    c.$('#cq-hud').inert=true;
    modal.style.display='flex';
    modal.innerHTML=`<section class="card cq-frame cq-${screen}" role="dialog" aria-modal="true" tabindex="-1">${html}</section>`;
    const card=modal.firstElementChild;
    const heading=card.querySelector('h1,h2');
    if(heading){heading.id='cq-panel-title';card.setAttribute('aria-labelledby',heading.id);}
    (card.querySelector('.menu-actions button:not(:disabled)')??card).focus({preventScroll:true});
    playModalCue();
  };
  modal.onkeydown=event=>{
    if(event.key==='Escape'&&c.modalBack){event.preventDefault();event.stopPropagation();c.modalBack();return;}
    const menu=event.target.closest('.menu-actions');
    if(!menu)return;
    if(event.key==='Enter'&&event.target.matches('button:not(:disabled)')){
      event.preventDefault();if(!event.repeat)event.target.click();return;
    }
    if(!['ArrowUp','ArrowDown'].includes(event.key))return;
    const buttons=[...menu.querySelectorAll('button:not(:disabled)')];
    const current=buttons.indexOf(document.activeElement);
    if(current<0)return;
    event.preventDefault();
    buttons[(current+(event.key==='ArrowDown'?1:-1)+buttons.length)%buttons.length].focus();
  };

  const renderDialogue = (count) => {
    const d=c.dialogue;
    if(count===d.shown)return;
    d.shown=count;
    // The hidden remainder reserves its final line breaks while the text is typing.
    c.$('.dialogue-typed').textContent=d.characters.slice(0,count).join('');
    c.$('.dialogue-untyped').textContent=d.characters.slice(count).join('');
    const done=count===d.characters.length;
    const choosing=done&&dialogueChoices.childElementCount>0;
    dialogueNext.toggleAttribute('data-ready',done);
    dialogueNext.hidden=choosing;
    dialogueChoices.hidden=!choosing;
    c.$('.dialogue-action').textContent=done?(d.page+1<d.pages.length?'Lanjut':'Tutup'):'Tampilkan';
    if(choosing)dialogueChoices.firstElementChild.focus({preventScroll:true});
  };
  const showDialoguePage = () => {
    const d=c.dialogue, page=d.pages[d.page];
    d.characters=Array.from(page.text);
    d.shown=-1;
    d.pageStartedAt=c.wall;
    dialogueFeedback.hidden=true;
    dialogueFeedback.textContent='';
    dialogueChoices.replaceChildren();
    for(const [label,action] of page.choices??[]){
      const button=document.createElement('button');
      button.type='button';
      button.textContent=label;
      button.onclick=action;
      dialogueChoices.appendChild(button);
    }
    c.$('.dialogue-reader').textContent=page.text;
    renderDialogue(Math.min(1,d.characters.length));
    dialogueCopy.scrollTop=0;
  };
  c.openDialogue = (speaker, pages) => {
    c.modal=true;
    c.npcSpeaker=speaker;
    c.dialogueOpenedAt=c.wall;
    c.dialogue={pages,page:0};
    modal.style.display='none';
    delete root.dataset.modal;
    c.$('#cq-speaker').textContent=speakers[speaker];
    const portrait=c.$('[data-npc-portrait]');
    const image=c.npcFrames[speaker]?.Talk?.[0]??componentArt[speaker];
    if(image)portrait.src=image;
    else portrait.removeAttribute('src');
    root.dataset.dialogue='';
    c.$('#cq-hud').inert=true;
    dialogueView.hidden=false;
    showDialoguePage();
    // GDevelop routes keyboard events away from the game when a DOM control has focus.
    s.getGame().getInputManager().releaseAllPressedKeys();
    dialoguePanel.focus({preventScroll:true});
    playModalCue();
  };
  c.advanceDialogue = () => {
    const d=c.dialogue;
    if(!d)return;
    if(d.shown<d.characters.length){renderDialogue(d.characters.length);return;}
    if(d.pages[d.page].choices)return;
    if(++d.page<d.pages.length)showDialoguePage();
    else c.close();
  };
  c.updateDialogue = () => {
    const d=c.dialogue;
    if(d.shown<d.characters.length)renderDialogue(Math.min(d.characters.length,1+Math.floor((c.wall-d.pageStartedAt)*options.textSpeed)));
  };
  dialogueNext.onclick=c.advanceDialogue;
  dialogueView.onkeydown = event => {
    const input=event.key.toLowerCase();
    if(event.altKey||event.ctrlKey||event.metaKey||!['e','escape','i'].includes(input))return;
    event.preventDefault();
    event.stopPropagation();
    if(event.repeat)return;
    if(input==='e')c.advanceDialogue();
    else c.close();
  };
  c.button = (id,fn) => c.$('#'+id).onclick=fn;
  const keysHelp=`<dl class="control-list"><dt><kbd class="key">A / D</kbd></dt><dd>Bergerak kiri dan kanan</dd><dt><kbd class="key">Space</kbd></dt><dd>Tahan untuk lompat tinggi</dd><dt><kbd class="key">W / S</kbd></dt><dd>Naik dan turun tangga</dd><dt><kbd class="key">E</kbd></dt><dd>Interaksi dan lanjut dialog</dd><dt><kbd class="key">J</kbd></dt><dd>Pulse Wave</dd><dt><kbd class="key">I</kbd> <kbd class="key">Esc</kbd></dt><dd>Inventory dan jeda</dd></dl>`;
  const nativeWindow=Boolean(renderer.getElectronRemote?.());
  const fullscreenSupported=nativeWindow||Boolean(document.fullscreenEnabled);
  const updateFullscreen=()=>{
    const button=c.$('#fullscreen');
    if(!button)return;
    const active=nativeWindow?renderer.isFullScreen():Boolean(document.fullscreenElement);
    button.textContent=fullscreenSupported?(active?'Aktif':'Nonaktif'):'Tidak tersedia';
    button.setAttribute('aria-checked',String(active));
  };
  document.addEventListener('fullscreenchange',updateFullscreen);
  window.addEventListener('resize',updateFullscreen);
  const disposeRoot=root._cqDispose;
  root._cqDispose=()=>{disposeRoot?.();document.removeEventListener('fullscreenchange',updateFullscreen);window.removeEventListener('resize',updateFullscreen);};
  c.settings = back => {
    c.open(`<div class="stack screen-body"><header><span class="tag">CIRCUIT QUEST / SISTEM</span><h2>Pengaturan</h2></header>
      <label class="settings-row" for="text-speed"><span>Kecepatan dialog<small><output id="text-speed-value">${options.textSpeed}</output> karakter/detik</small></span><input id="text-speed" type="range" min="20" max="80" step="4" value="${options.textSpeed}"></label>
      <label class="settings-row" for="reduce-motion"><span>Kurangi animasi UI<small>Hilangkan kedipan ornamen dan indikator</small></span><input id="reduce-motion" type="checkbox" ${options.reduceMotion?'checked':''}></label>
      <div class="settings-row"><span id="fullscreen-label">Layar penuh</span><button id="fullscreen" type="button" role="switch" aria-labelledby="fullscreen-label" ${fullscreenSupported?'':'disabled'}></button></div>
      <p id="settings-status" class="muted" role="status"></p>${keysHelp}</div><footer class="screen-footer"><div class="row"><button id="settings-back" type="button">Kembali</button></div></footer>`,{screen:'settings',back});
    updateFullscreen();
    c.$('#text-speed').oninput=event=>{options.textSpeed=Number(event.target.value);c.$('#text-speed-value').textContent=options.textSpeed;};
    c.$('#reduce-motion').onchange=event=>{options.reduceMotion=event.target.checked;root.toggleAttribute('data-reduce-motion',options.reduceMotion);};
    c.button('fullscreen',async()=>{
      try{
        if(nativeWindow)renderer.setFullScreen(!renderer.isFullScreen());
        else if(document.fullscreenElement)await document.exitFullscreen();
        else await document.documentElement.requestFullscreen();
        updateFullscreen();
      }catch{const status=c.$('#settings-status');if(status)status.textContent='Layar penuh dibatasi oleh perangkat atau browser.';}
    });
    c.button('settings-back',back);
  };
  c.about = () => {
    c.open(`<div class="stack screen-body"><span class="tag">ARSIP DESA SENSORIKA</span><h2>Tentang Circuit Quest</h2><p>Petualangan platformer 2D bersama Nova dan Volt. Temukan empat sensor di Hutan Sensor, pulihkan daya, lalu sambungkan Sensor Hub.</p>${keysHelp}</div><footer class="screen-footer"><div class="row"><button id="about-back" type="button">Kembali</button></div></footer>`,{screen:'about',back:c.title});
    c.button('about-back',c.title);
  };
  c.title = () => {
    c.open(`<div class="title-grid">
      <header class="title-lockup stack"><div class="title-emblem" aria-hidden="true">${icon('Jumper',42)}<i></i></div>
      <div class="title-rule"><span class="rune" aria-hidden="true"></span><span class="tag">DESA SENSORIKA · STAGE 01</span></div>
      <h1>Circuit<br><span>Quest</span></h1><span class="tag">HUTAN SENSOR</span><p>Blackout melanda desa. Bantu Nova dan Volt menemukan empat sensor dan memulihkan jaringan.</p></header>
      <nav class="title-nav stack" aria-label="Menu utama"><span class="tag">MENU UTAMA</span><div class="menu-actions">
      <button class="primary" id="begin" type="button">Mulai Petualangan</button><button id="title-settings" type="button">Pengaturan</button><button id="about" type="button">Tentang</button><button id="quit" type="button">Keluar</button></div></nav></div>`,{screen:'title',back:null});
    c.button('begin',()=>{c.started=true;root.dataset.playing='';c.close();c.say('Volt: Temui Prof. Ohm di terminal bercahaya. Tekan E untuk berinteraksi.',7);});
    c.button('title-settings',()=>c.settings(c.title));
    c.button('about',c.about);
    c.button('quit',()=>{
      if(nativeWindow||navigator.app?.exitApp){c.quitRequested=true;return;}
      c.open('<div class="stack"><span class="tag">CIRCUIT QUEST / SESI</span><h2>Sesi berakhir</h2><p>Tutup tab untuk keluar dari permainan.</p><div class="menu-actions"><button id="quit-back" type="button">Menu Utama</button></div></div>',{screen:'quit',back:c.title});
      c.button('quit-back',c.title);
    });
  };
  c.inventory = () => {
    if(!c.started||c.dead)return;
    c.open(`<div class="stack"><header><span class="tag">NOVA / SENSOR KIT</span><h2>Inventory</h2></header>
      <div class="kit-grid">${sensorNames.map(n=>`<div class="kit-item ${c.inv[n]?'':'missing'}">${icon(n,59)}<b>${n==='Soil'?'Soil Moisture':n}</b><small>${c.inv[n]?'TERKUMPUL':'DICARI'}</small></div>`).join('')}</div>
      <div class="kit-footer"><span>${icon('Jumper',25)} Jumper ${Object.keys(c.inv).length*3} / 12</span><span>${icon('Battery',22)} Baterai Mini +20 energi</span></div>
      <div class="row"><button id="resume" type="button">Kembali</button></div></div>`,{screen:'inventory'});
    c.button('resume',c.close);
  };
  c.pause = () => {
    if(!c.started||c.dead)return;
    c.open('<div class="stack"><span class="tag">STAGE 01 / HUTAN SENSOR</span><h2>Dijeda</h2><div class="menu-actions"><button class="primary" id="resume" type="button">Lanjutkan</button><button id="restart" type="button">Ulang Stage 1</button><button id="inventory" type="button">Inventory</button><button id="pause-settings" type="button">Pengaturan</button><button id="pause-title" type="button">Menu Utama</button></div></div>',{screen:'pause'});
    c.button('resume',c.close);c.button('inventory',c.inventory);c.button('restart',c.restart);
    c.button('pause-settings',()=>c.settings(c.pause));c.button('pause-title',c.restart);
  };
  c.victory = () => {
    const readings=[['Suhu','26.4°C'],['RH','68%'],['Tanah','54%'],['Cahaya','720 lx'],['Gerak','Ada']];
    c.open(`<div class="stack"><div class="result-crest" aria-hidden="true"><span class="rune"></span>${sensorNames.map(n=>icon(n,33)).join('')}<span class="rune"></span></div>
      <header><span class="tag">STAGE 01 / SELESAI</span><h2>Sensor Hub Aktif</h2></header>
      <p>Keempat sensor sudah mengirim data ke Desa Sensorika.</p><div class="reading-grid">${readings.map(([name,value])=>`<div class="reading"><span class="tag">${name}</span><b>${value}</b></div>`).join('')}</div>
      <div class="row"><button class="primary" id="explore" type="button">Kembali menjelajah</button><button id="restart" type="button">Main ulang</button><button id="win-title" type="button">Menu Utama</button></div></div>`,{screen:'victory'});
    c.button('explore',c.close);c.button('restart',c.restart);c.button('win-title',c.restart);
  };
  c.defeat = () => {
    c.open(`<div class="stack"><div class="result-crest" aria-hidden="true"><span class="rune"></span>${icon('Heart',40)}<span class="rune"></span></div><header><span class="tag">NOVA / SINYAL TERPUTUS</span><h2>Game Over</h2></header>
      <p>HP Nova habis. Lompat melewati duri dan tunggu korsleting padam.</p><div class="menu-actions"><button class="primary" id="retry" type="button">Coba Lagi</button><button id="defeat-title" type="button">Menu Utama</button></div></div>`,{screen:'defeat',back:null});
    c.button('retry',c.restart);c.button('defeat-title',c.restart);
  };
  const hearts=[...c.$('#cq-stats').children],bars=[...root.querySelectorAll('#cq-energy i')],slots=[...root.querySelectorAll('[data-sensor]')];
  c.updateHud = sensorCount => {
    if(c.uiHp!==c.hp){
      hearts.forEach((heart,i)=>heart.toggleAttribute('data-empty',i>=c.hp));
      c.$('#cq-hp').textContent=`HP ${c.hp}/5`;c.$('#cq-stats').setAttribute('aria-label',`${c.hp} dari 5 HP`);c.uiHp=c.hp;
    }
    if(c.uiEnergy!==c.energy){
      bars.forEach((bar,i)=>{bar.style.width=`${Math.max(0,Math.min(100,(c.energy-i*10)*10))}%`;});
      c.$('#cq-energy-value').textContent=c.energy;c.$('#cq-energy').setAttribute('aria-valuenow',String(c.energy));c.uiEnergy=c.energy;
    }
    if(c.uiSensorCount!==sensorCount){
      slots.forEach(slot=>slot.toggleAttribute('data-collected',Boolean(c.inv[slot.dataset.sensor])));
      c.$('#cq-count').textContent=`${sensorCount} / 4`;c.uiSensorCount=sensorCount;
    }
    const pulseState=c.energy<5?'empty':c.cooldown>0?'loading':'ready';
    if(c.uiPulseState!==pulseState){c.$('#cq-pulse').dataset.state=pulseState;c.uiPulseState=pulseState;}
  };
  c.button('cq-inventory',c.inventory);c.button('cq-pause',c.pause);
  root.querySelectorAll('[data-hold]').forEach(b=>{
    const held=b.dataset.hold;
    b.onpointerdown=e=>{
      e.preventDefault();
      b.setPointerCapture(e.pointerId);
      c.touch[held]=true;
      if(held==='e')c.touchInteraction=true;
      if(held==='Space')c.touchJump=true;
    };
    b.onpointerup=b.onpointercancel=()=>{c.touch[held]=false;};
  });
  c.damage=()=>{if(c.invuln>0||c.dead)return;c.hp--;c.invuln=1.5;c.hurtUntil=c.wall+hurtCue;c.say('Volt: Hati-hati! Tunggu celah aman atau gunakan Pulse Wave.');c.voltMood='Worried';c.voltUntil=c.wall+2;if(c.hp<=0){c.dead=true;c.modal=true;c.deathAt=c.wall+1;}};
  c.collect=n=>{if(c.inv[n])return;c.inv[n]=true;s.getObjects(n).forEach(o=>o.hide());c.interactUntil=c.wall+interactCue;c.say('Sensor ditemukan: '+({DHT22:'DHT22 — suhu & kelembapan udara',LDR:'LDR — intensitas cahaya',Soil:'Soil Moisture — kelembapan tanah',PIR:'PIR — gerakan'}[n]));c.voltMood='Happy';c.voltUntil=c.wall+2;};
  c.quiz = () => {
    if(c.inv.PIR){c.openDialogue('Warga',[{text:'Terima kasih! PIR mendeteksi gerakan, bukan cahaya.'}]);return;}
    const feedback = text => {
      dialogueFeedback.textContent=text;
      dialogueFeedback.hidden=false;
      dialogueFeedback.scrollIntoView({block:'nearest'});
    };
    c.openDialogue('Warga',[{
      text:'Alarm kebun tidak bekerja. Sensor mana yang mendeteksi gerakan orang di sekitar kebun?',
      choices:[
        ['LDR',()=>feedback('LDR mengukur cahaya. Coba lagi.')],
        ['PIR',()=>{c.collect('PIR');c.close();}],
        ['DHT22',()=>feedback('DHT22 mengukur suhu dan kelembapan udara. Coba lagi.')],
        ['Nanti dulu',c.close]
      ]
    }]);
  };
  c.assembly=()=>{
    const names=['DHT22','LDR','Soil','PIR'], pins=['D4','A0','A1','D5'];c.wires={};c.placed={};c.selectedChip=null;
    c.open(`<div class="stack screen-body"><header><span class="tag">WORKBENCH / SENSOR HUB</span><h2>Rakit Sensor Hub</h2></header><p>Tarik setiap sensor ke slotnya. Untuk tiap sensor, sambungkan VCC → 3V3, GND → GND, dan sinyal ke pin input.</p><div class="row">${names.map(n=>`<button type="button" draggable="true" class="chip" data-chip="${n}" aria-pressed="false">${icon(n,40)}${n}</button>`).join('')}</div>${names.map((n,i)=>`<div class="sensor"><button type="button" class="slot" data-slot="${n}">${icon(n,32)}Letakkan ${n}</button><div class="sockets">${['VCC','GND','DATA'].map(k=>`<label>${k}<select data-wire="${n}.${k}"><option value="">--</option>${['3V3','GND',...pins].map(p=>`<option>${p}</option>`).join('')}</select></label>`).join('')}<small>${n}.DATA → ${pins[i]}</small></div></div>`).join('')}</div><footer class="screen-footer"><div id="assembly-feedback" role="status"></div><div class="row"><button class="primary" id="test">Uji Rangkaian</button><button id="back">Kembali ke hutan</button></div><p class="muted">Ketuk atau pilih sensor, lalu pilih slot. Papan ini mensimulasikan pin input analog A0/A1.</p></footer>`,{screen:'workbench'});
    const chips=root.querySelectorAll('[data-chip]');
    chips.forEach(el=>{
      el.ondragstart=e=>e.dataTransfer.setData('text/plain',el.dataset.chip);
      el.onclick=()=>{
        c.selectedChip=el.dataset.chip;
        chips.forEach(chip=>chip.setAttribute('aria-pressed',String(chip===el)));
      };
    });
    root.querySelectorAll('[data-slot]').forEach(el=>{el.ondragover=e=>e.preventDefault();const place=n=>{if(n===el.dataset.slot){c.placed[n]=true;el.innerHTML=icon(n,32)+'✓ '+n;el.dataset.placed='';}};el.ondrop=e=>{e.preventDefault();place(e.dataTransfer.getData('text/plain'));};el.onclick=()=>place(c.selectedChip);});
    c.button('back',c.close);c.button('test',()=>{
      let errors=[];names.forEach((n,i)=>{if(!c.placed[n])errors.push(n+': sensor belum terpasang');['VCC','GND','DATA'].forEach((k,j)=>{const el=root.querySelector(`[data-wire="${n}.${k}"]`),ok=el.value===["3V3","GND",pins[i]][j];el.dataset.result=ok?'ok':'error';if(!ok)errors.push(n+'.'+k);});});
      if(errors.length){c.$('#assembly-feedback').innerHTML='<p class="fail">Percikan korsleting! Periksa: '+errors.join(', ')+'. Volt: cocokkan sumber daya, ground, dan sinyal.</p>';return;}
      s.getGame().getVariables().get('SensorHub').setNumber(1);s.getGame().getVariables().get('StageUnlocked').setNumber(2);
      c.victory();
    });
  };
  c.title();
  const solids=s.getObjects('Solid');
  for(const bug of s.getObjects('Bug')){
    const center=bug.getX()+bug.getWidth()/2, feet=bug.getY()+bug.getHeight();
    bug._patrolFloor=solids.find(o=>Math.abs(o.getY()-feet)<2&&center>=o.getX()&&center<=o.getX()+o.getWidth());
  }
  solids.concat(s.getObjects('Ladder')).forEach(o=>o.hide());
}
const c=s._cq,p=c.player,b=c.beh,dt=Math.min(s.getElapsedTime()/1000,.05);
if(c.quitRequested){gdjs.evtTools.runtimeScene.stopGame(s);return;}
if(c.restartRequested){
 gdjs.evtTools.runtimeScene.replaceScene(s,'MainGame Scene',false);
 return;
}
c.wall+=dt;
const key=k=>!!c.touch[k]||gdjs.evtTools.input.isKeyPressed(s,k);
const pressed=k=>key(k)&&!c.prev[k];
const interactionPressed=pressed('e')||c.touchInteraction;
const jumpPressed=pressed('Space')||c.touchJump;
c.touchInteraction=false;
c.touchJump=false;
const interact=interactionPressed&&!c.dialogue;
if(pressed('Escape')&&!c.dead){if(c.dialogue)c.close();else if(c.modal)c.modalBack?.();else if(c.started)c.pause();}
if(pressed('i')&&c.started&&!c.dead){if(c.modal)c.close();else c.inventory();}
if(c.dialogue&&interactionPressed)c.advanceDialogue();
if(c.dialogue)c.updateDialogue();
b.activate(!c.modal);
if(!c.modal){
 c.t+=dt;c.invuln-=dt;c.cooldown-=dt;
 if(key('a')||key('Left')){b.simulateLeftKey();c.face=-1;}
 if(key('d')||key('Right')){b.simulateRightKey();c.face=1;}
 if(jumpPressed)c.jumpQueuedUntil=c.wall+.09;
 const bufferedJump=c.wall<c.jumpQueuedUntil&&(b.isOnFloor()||b.isOnLadder());
 if(key('Space')||jumpPressed||bufferedJump)b.simulateJumpKey();
 if(bufferedJump){c.jumpQueuedUntil=0;c.jumpStartUntil=c.wall+.08;}
 if(key('w')||key('Up')){b.simulateLadderKey();b.simulateUpKey();}
 if(key('s')||key('Down')){b.simulateLadderKey();b.simulateDownKey();}
 p.setOpacity(c.invuln>0?(Math.floor(c.t*15)%2?90:255):255);
 if(p.getX()<0)p.setX(0);if(p.getX()>6460)p.setX(6460);
 const near=(o,dist=110)=>Math.abs(o.getX()-p.getX())<dist&&Math.abs(o.getY()-p.getY())<120;
 const hit=(a,o)=>{const left=a.getX()+(a===p?33:0),right=a.getX()+(a===p?63:a.getWidth()),top=a.getY()+(a===p?17:0),bottom=a.getY()+(a===p?90:a.getHeight());return right>o.getX()+5&&left<o.getX()+o.getWidth()-5&&bottom>o.getY()+(o.getName()==='Bug'?10:5)&&top<o.getY()+o.getHeight()-5;};
 if(p.getY()>1450){c.damage();p.setPosition(...c.checkpoint);b.setCurrentFallSpeed(0);b.setCurrentSpeed(0);c.jumpQueuedUntil=0;c.cameraY=undefined;}
 if(p.getX()>1800&&p.getX()<2700&&p.getY()<650)c.checkpoint=[1800,518];
 if(p.getX()>3200&&p.getX()<4350&&p.getY()>900)c.checkpoint=[3200,1030];
 if(p.getX()>5250&&p.getY()<650)c.checkpoint=[5250,518];
 if(key('j')&&c.cooldown<=0&&c.energy>=5){
  const pulse=s.createObject('Pulse');
  pulse.setPosition(p.getX()+(c.face>0?76:0),p.getY()+50);
  pulse.setSize(28,16);pulse.setZOrder(30);pulse._dir=c.face;pulse._life=.65;
  c.energy-=5;c.cooldown=.34;c.attackUntil=c.wall+pulseCue;
  if(p.getAnimationName()==='Pulse')p.setAnimationFrame(0);
 }
 for(const pulse of s.getObjects('Pulse')){
  pulse._life-=dt;
  if(pulse._life<=0){pulse.deleteFromScene(s);continue;}
  pulse.setX(pulse.getX()+pulse._dir*680*dt);
  const touched=o=>o.isVisible()&&hit(pulse,o);
  const bug=s.getObjects('Bug').find(touched),target=bug??s.getObjects('Glitch').find(touched);
  if(!target)continue;
  if(bug){const bat=s.createObject('Battery');bat.setPosition(bug.getX(),bug.getY());bat.setSize(36,36);}
  target.deleteFromScene(s);pulse.deleteFromScene(s);
 }
 for(const o of s.getObjects('Bug')){
  const v=o.getVariables(),home=v.get('home').getAsNumber(),dx=p.getX()-o.getX();
  let dir=v.get('dir').getAsNumber()||1;
  if(Math.abs(dx)<200&&Math.abs(p.getY()-o.getY())<120)dir=Math.sign(dx)||1;
  else if(o.getX()>=home+90)dir=-1;
  else if(o.getX()<=home-90)dir=1;
  v.get('dir').setNumber(dir);
  const next=o.getX()+dir*65*dt, floor=o._patrolFloor;
  o.setX(floor?Math.max(floor.getX(),Math.min(floor.getX()+floor.getWidth()-o.getWidth(),next)):next);
  o.flipX(dir<0);
  if(hit(p,o))c.damage();
 }
 for(const o of s.getObjects('Glitch')){const visible=c.t%4<1.6;o.hide(!visible);if(visible&&hit(p,o))c.damage();}
 for(const o of s.getObjects('Thorn')){o.setAnimation(Math.floor(c.t*2)%3);if(hit(p,o))c.damage();}
 for(const o of s.getObjects('Short')){const phase=c.t%3.5,active=!c.power&&phase>1.5;o.setAnimation(active?2:!c.power&&phase>1?1:0);if(active&&hit(p,o))c.damage();}
 for(const o of s.getObjects('Battery'))if(hit(p,o)){c.energy=Math.min(100,c.energy+20);o.deleteFromScene(s);c.say('Baterai Mini: +20 energi.',2);}
 const ladder=s.getObjects('Ladder').find(o=>Math.abs(p.getX()+48-o.getX()-o.getWidth()/2)<82&&p.getY()+90>o.getY()-32&&p.getY()<o.getY()+o.getHeight());
 let prompt=ladder?(ladder.getX()>4000?'W / ↑ · Naik     Tahan D / → di ujung tangga':'W / S · Naik / turun tangga'):'';
 for(const o of s.getObjects('Chest')){
  const n=o.getVariables().get('sensor').getAsString();
  if(c.inv[n])continue;
  const label=n==='Soil'?'Soil Moisture':n;
  const heightDiff=p.getY()+90-o.getY()-o.getHeight();
  if(near(o)&&b.isOnFloor()&&Math.abs(heightDiff)<=20){
   prompt='E · Buka peti '+label;
   if(interact){c.collect(n);o.setAnimation(1);}
  }else if(heightDiff>50&&near(o,330))prompt='Tahan Space · Lompat ke platform '+label;
 }
 if(near(s.getObjects('Terminal')[0])||near(s.getObjects('Ohm')[0])){
  prompt='E · Prof. Ohm / Research Station';
  if(interact){
   c.energy=100;c.hp=Math.min(5,c.hp+1);
   c.openDialogue('Ohm',[
    {text:'Sensor adalah input. DHT22 membaca suhu dan kelembapan udara. LDR membaca cahaya.'},
    {text:'Soil Moisture membaca kelembapan tanah. PIR mendeteksi gerakan.'},
    {text:'Tahan Space untuk naik ke platform DHT22. Peti LDR ada di platform setelah jembatan.'},
    {text:'Turun tangga ke gua untuk Soil Moisture. Temui Penjaga Kebun untuk PIR, lalu aktifkan pos daya sebelum memakai Workbench.'},
    {text:'Rakit: VCC ke 3V3, GND ke GND.\nSinyal: DHT22 → D4, LDR → A0, Soil → A1, PIR → D5.'},
    {text:'Stasiun memulihkan energi dan 1 HP.'}
   ]);
  }
 }
 if(near(s.getObjects('Warga')[0])){prompt='E · Warga / Quest sensor gerak';if(interact)c.quiz();}
 if(near(s.getObjects('SensorPost')[0])){prompt='E · '+(c.power?'Daya pulih / isi energi':'Pulihkan gangguan listrik');if(interact){c.power=true;c.energy=100;c.say('Daya stabil! Korsleting padam. Meja rakit siap digunakan.');}}
 if(near(s.getObjects('Workbench')[0])){prompt='E · Workbench / Sensor Hub';if(interact){if(Object.keys(c.inv).length<4)c.say('Volt: Kita masih membutuhkan '+['DHT22','LDR','Soil','PIR'].filter(n=>!c.inv[n]).join(', ')+'.');else if(!c.power)c.say('Volt: Aktifkan pos daya di sebelah kiri untuk menstabilkan listrik.');else c.assembly();}}
 const message=c.t<c.until?c.message:'';
 const hint=prompt||(message?'':'A / D · Bergerak     Space · Lompat     E · Interaksi     J · Pulse');
 const promptText=c.$('#cq-prompt'),messageText=c.$('#cq-message');
 if(promptText.textContent!==hint)promptText.textContent=hint;
 if(messageText.textContent!==message)messageText.textContent=message;
 c.$('#cq-tip').hidden=!hint&&!message;
 const layer=s.getLayer('');
 const halfWidth=Math.min(3264,layer.getCameraWidth()/2),halfHeight=Math.min(680,layer.getCameraHeight()/2);
 const targetY=Math.max(halfHeight,Math.min(1360-halfHeight,p.getY()-10));
 const cameraY=c.cameraY??targetY;
 const followY=Math.max(targetY-24,Math.min(targetY+24,cameraY));
 c.cameraY=Math.max(halfHeight,Math.min(1360-halfHeight,cameraY+(followY-cameraY)*Math.min(1,dt*9)));
 layer.setCameraX(Math.round(Math.max(halfWidth,Math.min(6528-halfWidth,p.getX()+180))));
 layer.setCameraY(Math.round(c.cameraY));
 const volt=s.getObjects('Volt')[0];const vx=p.getX()+24-c.face*52,vy=p.getY()+4+Math.sin(c.t*3)*4;const follow=Math.min(1,dt*8);volt.setPosition(volt.getX()+(vx-volt.getX())*follow,volt.getY()+(vy-volt.getY())*follow);volt.flipX(c.face<0);
 s.getObjects('Terminal')[0].setAnimation(1);s.getObjects('Workbench')[0].setAnimation(c.power?1:0);
 s.getObjects('Workbench')[0].setColor(c.power?'190;255;230':'255;255;255');
 s.getObjects('SensorPost')[0].setColor(c.power?'255;255;255':'155;175;185');
}
// Supplied mentor and villager animations continue while their dialogue is open.
for(const name of ['Ohm','Warga']){
 const npc=s.getObjects(name)[0];if(!npc)continue;
 const dx=p.getX()+48-(npc.getX()+48),dy=p.getY()-npc.getY();
 if(Math.abs(dx)<250&&Math.abs(dy)<120)npc.flipX(dx<0);
 let action='Idle';
 if(c.modal&&c.npcSpeaker===name){action=name==='Ohm'&&(c.wall-c.dialogueOpenedAt)%7>1.5?'Explain':'Talk';}
 else if(name==='Ohm'&&!c.modal&&Math.abs(dx)<220&&Math.abs(dy)<120&&c.wall%7<1.2)action='Diagnostic';
 if(npc.getAnimationName()!==action){npc.setAnimationName(action);npc.setAnimationFrame(0);}
 if(c.modal&&c.npcSpeaker===name){const portrait=c.$('[data-npc-portrait]'),frames=c.npcFrames[name]?.[action];if(portrait&&frames){const src=frames[npc.getAnimationFrame()%frames.length];if(portrait.getAttribute('src')!==src)portrait.setAttribute('src',src);}}
}
// Fixed 128x128 animation canvases and one stable collision mask prevent size/feet jitter.
let novaAction='Idle';
const speed=b.getCurrentSpeed();
const airborne=!b.isOnFloor()&&!b.isOnLadder();
if(!c.modal){if(c.wasAirborne&&!airborne)c.landUntil=c.wall+.09;c.wasAirborne=airborne;}
if(c.dead)novaAction='Defeat';
else if(c.wall<(c.hurtUntil||0))novaAction='Hurt';
else if(c.wall<c.attackUntil)novaAction='Pulse';
else if(c.wall<c.interactUntil)novaAction='Interact';
else if(!c.modal&&b.isOnLadder())novaAction=key('s')||key('Down')?'ClimbSide':'Climb';
else if(!c.modal&&(airborne||c.wall<(c.landUntil||0)))novaAction='Jump';
else if(!c.modal&&Math.abs(speed)>=140)novaAction='Run';
else if(!c.modal&&Math.abs(speed)>15)novaAction='Walk';
if(!c.modal)p.flipX((novaAction!=='Pulse'&&Math.abs(speed)>15?speed:c.face)<0);
if(p.getAnimationName()!==novaAction){p.setAnimationName(novaAction);p.setAnimationFrame(0);}
p.setAnimationSpeedScale(novaAction==='Run'?Math.max(.65,Math.min(1.2,Math.abs(speed)/280)):novaAction==='Walk'?Math.max(.6,Math.min(1.2,Math.abs(speed)/100)):1);
if(novaAction.startsWith('Climb')&&!key('w')&&!key('s')&&!key('Up')&&!key('Down'))p.pauseAnimation();else p.playAnimation();
if(novaAction==='Jump'){const dy=p.getY()-(c.lastY??p.getY());p.setAnimationFrame(!airborne&&c.wall<(c.landUntil||0)?5:c.wall<(c.jumpStartUntil||0)?0:Math.abs(dy)<1?2:dy<0?1:dy<3?3:4);p.pauseAnimation();}
c.lastY=p.getY();
const companion=s.getObjects('Volt')[0];const voltAction=c.dead?'Worried':c.wall<c.voltUntil?c.voltMood:'Hover';
if(companion.getAnimationName()!==voltAction)companion.setAnimationName(voltAction);
if(c.dead&&!c.gameOverShown&&c.wall>=c.deathAt){c.gameOverShown=true;c.defeat();}
// Sync HUD only when its displayed values change.
const sensorCount=Object.keys(c.inv).length;
c.updateHud(sensorCount);
const globals=s.getGame().getVariables();globals.get('PlayerHP').setNumber(c.hp);globals.get('PlayerEnergy').setNumber(c.energy);
for(const n of ['DHT22','LDR','Soil','PIR'])globals.get('Inventory').getChild(n).setNumber(c.inv[n]?1:0);
globals.get('Inventory').getChild('KabelJumper').setNumber(sensorCount*3);
globals.get('QuestState').getChild('Rani').setNumber(c.inv.PIR?2:0);
for(const k of ['Escape','i','e','Space'])c.prev[k]=key(k);
