from pathlib import Path
root=Path(__file__).resolve().parent.parent
p=root/'portal/assets/s17-reader.js'
t=p.read_text(encoding='utf-8')
changes=[
('function background(sc,c){', 'function four(sc,c){return [\'m1\',\'m3\',\'m4\',\'m5\'].includes(sc.id)&&c.version===\'1.7.1\';}\nfunction fourStyle(sc){return g.S17MudKnowledge[sc.id].sections[0].html.match(/<style>[\\s\\S]*?<\\/style>/)?.[0]||\'\';}\nfunction background(sc,c){if(four(sc,c))return fourStyle(sc)+g.S17MudKnowledge[sc.id].backgroundHTML;'),
('function workflow(sc,c){', 'function workflow(sc,c){if(four(sc,c))return fourStyle(sc)+\'<div class="fx-exhibit fx-card" data-scene="\'+sc.id+\'"><span class="fx-kicker">METHOD / 当前对象的逐步计算</span><h2>从输入到可以回查的产物</h2><p>这里保留默认情景的实际产物；进入可运行示范可改变条件并重算。</p>\'+g.S17MudKnowledge[sc.id].workflowHTML+\'</div>\';'),
('function demo(sc,c){const m2=', 'function demo(sc,c){if(four(sc,c))return fourStyle(sc)+\'<div class="sr-demo-bar"><div><span class="sr-eyebrow">03 / 动手看变化</span><strong>\'+esc(c.title)+\'</strong><p>\'+esc(c.tabs.demo.intro)+\'</p></div><button type="button" data-sr-focus aria-pressed="false">专注演示 ↗</button></div><div id="case-demo-root"></div>\';const m2='),
('root.classList.add(\'s17-case-page\');', 'root.classList.add(\'s17-case-page\');const fs=location.hash.match(/^#\\/scene\\/(m[1345])(?:[?]|$)/)?.[1];root.classList.toggle(\'fx-exhibit-parent\',!!fs&&g.Cases?.get(g.S17Course.byScene(fs).id)?.version===\'1.7.1\');'),
('.case-flow-overview,.m2-exhibit\')', '.case-flow-overview,.m2-exhibit,.fx-exhibit\')'),
('g.M2Reading?.mount(root);', 'g.S17Exhibit?.readingMount(root);g.M2Reading?.mount(root);')
]
for old,new in changes:
    if new in t: continue
    if t.count(old)!=1: raise RuntimeError('Expected one marker: '+old)
    t=t.replace(old,new,1)
p.write_text(t,encoding='utf-8')
