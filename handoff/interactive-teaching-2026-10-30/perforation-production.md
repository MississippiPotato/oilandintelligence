# 射孔 p1—p4、采油 pr1—pr5：知识交互实施记录

实施日期：2026-10-30。范围为 9 个 `expansion-src/<id>/concept.js` 和本记录。每例注册 `S17Concepts[scene]`，包含静态可读的背景图、流程图与局部 `mount`。未修改原 `engine.js`、`app.js`、`case.json`、共享脚本、构建脚本、dist 或老师原站；未增加图片素材与运行依赖。

每个单元的控件在静态 HTML 中为 disabled；mount 后启用，按本 host 绑定事件，每次重绘记录实际输入及实际计算产物到 `data-ct-state`，提供复位与“读取本次实验”。无有效当前实验时保留默认计算，并明确提示来源。朱红 #B8242A、暖白 #F7F4EF、蓝灰 #55768B、赭金 #B08A4A；正文18px，控件/图注16px，SVG最小宽度720px，窄屏只在图容器内滚动。

## 插入点

位置从0开始，均对应已有知识或步骤。

| 案例 | backgroundAfter | 对应知识 | workflowAfter | 对应动作 |
| --- | ---: | --- | ---: | --- |
| p1 | 1 | 孔密、相位和穿深各控制什么 | 2 | 画出受约束的候选域 |
| p2 | 1 | 同样试验条件为何得到不同孔道 | 2 | 改变条件比较响应 |
| p3 | 0 | 从通道、环境与材料筛目录 | 2 | 在可行集合中排序 |
| p4 | 0 | 前后产量中的工况贡献 | 2 | 分解实际变化 |
| pr1 | 1 | 理想/异常井下泵图的卸载过程 | 1 | 归一化与提取形状 |
| pr2 | 1 | 时间切分是预测问题的核心 | 2 | 递归走完未来窗口 |
| pr3 | 1 | 边际响应与分水 | 2 | 守恒枚举与约束筛除 |
| pr4 | 1 | 正常关系比固定阈值更合适 | 2 | 从残差形成告警 |
| pr5 | 1 | 温差、含蜡量、流动条件联合影响 | 2 | 用阈值形成复核队列 |

## p1：相位、越带与候选可行域

背景把角向与径向分开：改变60/90/120/180°相位，圆周方位数和原引擎径向均匀度同时更新；改变穿深与损伤厚度，在同一厘米尺上核对穿深是否越过损伤带及5 cm余量。不是把相位、穿深都画成相同的设备拼图。

流程固定一个相位画11孔密×10穿深的实际约束网格。预算、损伤厚度、拥挤上限和相位均可操作；每格计算成本、拥挤指数、越带余量及全部排除原因。朱红为可行；不可行按首个触发原因着色，计数保留重叠分母。默认相位120°可行69/110，四相位合计274/440；预算5、损伤35、拥挤上限0.5时为0可行，不从排除项中推荐。

计算沿用 [p1/engine.js](../../expansion-src/p1/engine.js) 的 `geometry/costs/crowding/check`；未调用 `evaluate` 或教学响应函数。读取实验时流程取当前约束，背景取 `CaseInspect.evidence().selected` 中已冻结候选几何及当前损伤厚度。专业来源沿用 [p1/knowledge.md](../../expansion-src/p1/knowledge.md) 中的 [SLB Perforating](https://www.slb.com/resource-library/oilfield-review/defining-series/defining-perforating)、[phasing](https://glossary.slb.com/Terms/p/perforation_phasing.aspx)、[penetration](https://glossary.slb.com/Terms/p/perforation_penetration.aspx)。

## p2：材料条件与两项孔道输出

背景让读者改强度30—150 MPa、孔隙度5—28%、围压3—28 MPa。厘米量尺按预测长度延伸，清洁度作为独立0—100评分读取，孔道宽度保持固定，未把长度或清洁度换成流量。

流程在相同强度轴上比较联合回归和训练强度分组均值，当前材料点随强度移动；只改孔隙度/围压，联合曲线改变，分组均值不变。默认长度42.7657548332 cm、清洁度76.3298316299分，均值基线41.3492403687 cm。

冻结系数直接由 [p2/engine.js](../../expansion-src/p2/engine.js) 固定种子1702的168条训练记录导出，特征与 `feature` 一致；静态图可独立计算，读取实验后换用 `snapshot.result.model` 的两组系数和当前材料参数。没有用84条留出目标生成预测。专业概念沿用 [p2/knowledge.md](../../expansion-src/p2/knowledge.md) 的 [SLB perforation](https://glossary.slb.com/en/terms/p/perforation) 与 [OSHA术语](https://www.osha.gov/etools/oil-and-gas/glossary-of-terms-p)；具体材料数值关系保持为原案例的公开教学设定。

## p3：目录硬约束矩阵与偏好取舍

背景是6项目录×通道/温度/材料的字段矩阵；改变需求或把B项温度置为缺失，每格勾叉与完整排除原因重算。默认B、F可行；B温度缺失后只保留F。无解时保留无解。

流程在深度—流通共同坐标画目录散点，可行项朱红、排除项灰色、当前首项放大。偏好分按 `w×深度+(1−w)×流通−0.18×成本` 重算，可行性独立于权重。默认B=63.56、F=57.73，硬约束不允许高分排除项进入排序。

目录、规则、分数完整沿用 [p3/engine.js](../../expansion-src/p3/engine.js) 的 `catalog/infer`，读取实验时取当前需求和现有目录。六项均为虚构项，指数和温度等级为教学属性，未引入真实型号或作业参数。专业来源沿用 [p3/knowledge.md](../../expansion-src/p3/knowledge.md) 中的 [SLB perforation](https://glossary.slb.com/en/terms/p/perforation) 与 [OSHA术语](https://www.osha.gov/etools/oil-and-gas/glossary-of-terms-p)。

## p4：工况参照与有符号的变化分解

背景按压差—预期日产油关系画条件曲线，另标作业前压差6 MPa、含水40%的参照点。改变作业后压差/含水，当前点及前后工况贡献随之改变，单位均为m³/d。

流程以共享正负标尺画变化瀑布：实际前后变化、扣除工况贡献、校正后剩余。作业后观测日产油独立可改，不用设定效果标签代替校正结果。默认实际变化20.56、工况贡献12.5790551230、剩余7.9809448770 m³/d。负剩余保留为复核线索，不写成作业因果效应。

计算用 [p4/engine.js](../../expansion-src/p4/engine.js) 固定种子1704拟合的稳定工况系数及可见前后观测；读取实验只取 `prediction` 中的before/after/q0/q1与冻结beta，不取effect标签。专业来源沿用 [p4/knowledge.md](../../expansion-src/p4/knowledge.md) 的 [SLB productivity index](https://glossary.slb.com/en/Terms/p/productivity_index_pi.aspx) 与 [Reservoir Engineering](https://www.slb.com/resource-library/oilfield-review/defining-series/defining-reservoir-engineering)。

## pr1：完整泵功环与局部卸载特征

背景沿194个有序载荷—位移点走完整井下泵功环，形状、零点偏移和循环点可操作；当前位移/载荷及多边形闭合面积同步计算。默认气影响形循环功54.0317424050 kJ/循环。零点上移20 kN时循环功保持不变，这是应保留的几何不变性。

流程先按自身跨度归一化并作各支5点平滑，再在20/40/60/80%冲程读取上、下支与间距，同时展示面积比、下支最大平滑斜率及20—80%过渡宽度。默认40%位置间距0.7789658273，面积比0.5564615500；改零点后归一化形状与特征保持，改教学形状则改变局部卸载过程。

生成与提取逐项复现 [pr1/engine.js](../../expansion-src/pr1/engine.js) 的 `makeCard(seed=917)/polygonArea/extract`。读取实验用 `evidence().currentObservation` 的完整观测，不读取测试类别或评价真值；改变形状后沿用当前噪声重新生成原案例教学曲线。专业来源沿用 [pr1/knowledge.md](../../expansion-src/pr1/knowledge.md) 的 [SLB Rod Pumps](https://www.slb.com/resource-library/oilfield-review/defining-series/defining-rod-pumps)、[gas interference](https://glossary.slb.com/en/terms/g/gas_interference)、[dynamometer card](https://glossary.slb.com/Terms/d/dynamometer_card.aspx)。本图明确是合成井下图，未混称地面示功图。

## pr2：时间边界与递归滞后来源

背景拖动首个未知日和预测长度，显示边界附近历史、递归预测与持续值。预测窗口内每次1/2/7日滞后取值均标明来自已知观测还是先前预测；默认21天共有63次滞后读取，其中53次读取先前预测。

流程展开任意第1—35步：把本步三个真实输入沿更早日期连向当前输出，明确显示日期、m³/d和来源。默认第7步目标日116，输出59.8007563881 m³/d；前1/2日为先前预测，前7日为历史第109日。改变截止日会只用该日前历史重新拟合。

计算复现 [pr2/engine.js](../../expansion-src/pr2/engine.js) 的种子1722序列、`features/train/infer`；读取实验仅取冻结beta和trace，不取未来评价线。默认主实验递归MAE=7.0116874623、持续值MAE=1.4298157534 m³/d，明确保留基线更好的负结果；未用新单元掩盖它。专业时间序列背景沿用 [pr2/knowledge.md](../../expansion-src/pr2/knowledge.md) 中的 [SLB Reservoir Engineering](https://www.slb.com/resource-library/oilfield-review/defining-series/defining-reservoir-engineering)。

## pr3：边际响应与守恒可行面

背景三层使用同一注水量轴，改当前单层配额，实际求“再加5 m³/d”各层增量。默认60→65 m³/d，A/B/C响应增量为2.3697880889 / 2.3348630625 / 1.9898678977；明确这不是同时增水后的守恒方案。

流程以A配额为横轴、B配额为纵轴，由C=总量−A−B确定第三层，按5 m³/d枚举。总量和三层上限可操作，可行点、边界和候选实时变化。默认703组合、384可行，候选70/70/40 m³/d，严格和为180，代理总响应105.7502018844；均分可行时增益0.7743514718。三层上限各20而总量180时无解；均分不可行时不计算其“增益”。

代理系数与枚举沿用 [pr3/engine.js](../../expansion-src/pr3/engine.js) 的三组二次模型及 `search`，不调用真实教学响应为候选排序。专业来源沿用 [pr3/knowledge.md](../../expansion-src/pr3/knowledge.md) 的 [SLB waterflood](https://glossary.slb.com/en/terms/w/waterflood) 与 [Reservoir Engineering](https://www.slb.com/resource-library/oilfield-review/defining-series/defining-reservoir-engineering)。

## pr4：正常负荷参照与第3点确认

背景改变负荷、电流和观测温度，把当前点放到冻结正常关系上；垂直距离实际计算残差。默认65%、42 A、82°C，对应预期77.9389227587°C，残差4.0610772413°C。

流程显示120分钟实际残差数组，拖阈值并选择回查分钟，突出本分钟及前两分钟，逐点检查 `residual > threshold` 与连续3点确认。默认阈值4°C，首次确认81 min；逐点超阈42分钟，已连续3点确认39分钟。单元不使用评价异常边界，不把这些无标签计数误写成精确率或误报。

默认观测与冻结beta复现 [pr4/engine.js](../../expansion-src/pr4/engine.js) 种子1734。读取实验取当前正常系数、温度/电流可见曲线及残差曲线，未读取truth或混淆计数。专业来源沿用 [pr4/knowledge.md](../../expansion-src/pr4/knowledge.md) 的 [SLB ESP资料](https://www.slb.com/-/media/files/oilfield-review/p30-43-2) 与其已列 [IEEE文献](https://ieeexplore.ieee.org/abstract/document/9312611)。

## pr5：结蜡关系面与分数阈值队列

背景壁温—含蜡量为共同坐标，固定当前WAT/流速后每格都计算联合逻辑回归分数；改变WAT或流速会重算整片关系面，改变当前壁温/含蜡量移动点和读数。默认温差10°C、分数57.6022035361%，温度规则为真。分数明确未作现场概率校准。

流程对175条无标签工况按分数降序排列，调复核阈值改变队列颜色和数量，选择原始记录可回查四项输入、分数与名次。默认阈值0.5时联合队列81/175、温度规则127条、两种标记分歧46条。只调阈值，175条分数逐值保持不变。

冻结beta、特征和sigmoid沿用 [pr5/engine.js](../../expansion-src/pr5/engine.js)；测试工况按种子9735复现，仅消耗原记录的第5个随机数以保持观测序列，不生成或读取事件标签。读取当前实验只取冻结beta与参数。默认主实验温度基线F1=0.7534883721，高于联合F1=0.7337278107；单元明确保留该结果，队列大小不表示性能提升。专业来源沿用 [pr5/knowledge.md](../../expansion-src/pr5/knowledge.md) 中的 [SLB OLGA Wax](https://www.slb.com/products-and-services/delivering-digital-at-scale/software/olga/olga-solids-management/olga-wax) 与油样组成资料。机理范围仍是结蜡，未把无机盐结垢合并计算。

## 验证记录与边界

- 9个普通JS脚本语法检查通过；在带抛错document/CaseInspect getter的VM中注册成功，证明生成静态HTML时未读取页面状态。
- 18份初始HTML均有默认SVG与实际读数，全部控件初始disabled，无inline事件、script或远程自动资源。
- 默认计算与各自原引擎逐项比较通过，数值差阈值1e−9；涵盖p1可行计数/几何、p2两项目标/基线、p3候选排序、p4三项增量、pr1面积/间距/斜率/过渡宽度、pr2逐日预测与trace、pr3配额/目标/增益、pr4全部120残差与确认时刻、pr5全部175分数与队列数。
- 132个默认、单控件端点和联合端点渲染变体未出现NaN/Infinity/undefined。
- 用原引擎真实产物的接口形状，18个 `loadCurrent` 分支在VM中通过；p1/pr1用evidence，其余用snapshot.result。这是数据适配检查，不是原应用浏览器集成验收。
- 独立Chrome会话 `concept-production` 的临时本地组件页（每页加载当前引擎和两个知识单元）验证9例/18单元：mount后控件启用，真实选择或键盘操作后图形、结果文字、data-ct-state都变化，复位后完整状态逐字恢复。
- 9例均检查390×844窄屏：页面scrollWidth=375≤390，图容器clientWidth=307、内部scrollWidth=720；页面未被知识图撑宽。9例加载的pageerror为0。
- 对9例默认图做过截图目视检查，并给坐标图增加顶部说明留白、调整高位散点标签，避免说明压住数据。截图仅为临时QA产物，未加入教材素材或交付包。
- 保留且单独检查：pr1零点平移后的循环功/归一化面积不变；pr5阈值改变后分数不变；p1紧预算无解、p3关键属性缺失排除、pr3能力不足无解。

本组已完成组件级验证。**尚未在本组验证**：主会话统一构建后的实际章节插入、原app真实CaseInspect按钮联动、老师原站导入/刷新/重算、离线五文件包、主站样式下的完整桌面/手机验收。以上由主会话接线后统一检查；组件页通过不等于这些交付路径通过。本轮沿用本地知识页已列来源，未重新打开外站作新专业事实核查。
