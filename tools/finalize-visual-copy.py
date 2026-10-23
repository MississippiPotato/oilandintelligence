from pathlib import Path
import json
R=Path(__file__).resolve().parent.parent
changes={
 'case-src/m1/lesson.js':[('数据为教学合成，不能替代矿物分析或现场岩性解释。','以教学合成样品观察轮廓、纹理和候选外观。')],
 'case-src/m2/lesson.js':[('岩屑、荧光等可作为后续复核证据，本轮不伪造其结论。','结合岩屑、荧光等其他观察继续复核。')],
 'case-src/m5/ui.js':[('NB与关键词在内置测试上的宏F1相同，比较重点还包括分数依据和逐句核验。',"${m.model.macroF1===m.baseline.macroF1?'当前NB与关键词宏F1相同，可继续比较分数依据和逐句核验。':'当前训练标签下的NB与关键词成绩见上方对照。'}")],
 'portal/assets/s17-assistant.js':[('大模型服务待指定；当前固定导学与导航不冒充模型回答。','当前为本地导览；连接模型后可开放提问。')]
}
p=R/'handoff/interactive-views-2026-10-23/wording-changes.json'
log=json.loads(p.read_text(encoding='utf-8'))
for name,pairs in changes.items():
 f=R/name;s=f.read_text(encoding='utf-8')
 for old,new in pairs:
  assert old in s,(name,old)
  s=s.replace(old,new);log.append({'path':name,'before':old,'after':new})
 f.write_text(s,encoding='utf-8',newline='\n')
p.write_text(json.dumps(log,ensure_ascii=False,indent=2),encoding='utf-8')
print('Recorded',len(log),'targeted presentation changes')
