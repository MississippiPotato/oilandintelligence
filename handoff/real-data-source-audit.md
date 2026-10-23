# v1.1公开实测来源与语义审计

获取并核对日期：2026-10-23。只使用作者/数据发布平台原始来源。全部观测已固化到离线成品；运行没有数据请求。机器锁定记录为real-data-lock.json，署名与许可为../data/real/ATTRIBUTION.txt。数据性质是public_measured；和DEMO-017合成实验分别保存。

## USROP钻进参数

[作者仓库](https://github.com/AndrzejTunkiel/USROP)的A版数据声明CC BY-NC-SA 4.0。固定提交627cddb27f0250de2ac5222db4cc13ae0798efe0，原文件USROP_A 3 N-SH-F-15d.csv，53,041行，SHA256为811c8c08f28f7ccbbb7ceb90c623811bc02f6c7497184ba54b1c3ecf9ea9d014。上游署名Andrzej Tunkiel及USROP贡献者，底层来源Volve / Equinor。原CSV和README随总包保留。

在原MD 2200–2500 m条件内有736行，按原行位置均匀选择480行，不插值。摘录实际范围2221.745–2490.813 m MD；保留sourceRow。WOB由kkgf乘9.80665转为kN，流量L/min除60000转为m³/s，其他原值不改。逐行和原CSV核对了MD、WOB、ROP、扭矩、流量。未补时间戳、操作标签、岩性或地层界面。

m4在前部深度块拟合logROP/logtorque标准化和k-means，后部为留出块；再显示连续响应候选，报告训练/留出失真。默认288行拟合、192行留出。相邻深度高度相关，留出失真不是独立井泛化性能。缺少同岩性工况标定时，不把合成标定系数套入实测，也不把簇叫岩性，不输出准确率/F1。

摘录和派生的数据结果继续使用[CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/)，用于非商业教学，保留署名、转换说明和相同方式共享要求。另行查阅的Equinor/SLB共享许可PDF描述的是cement evaluation数据，范围不匹配，没有将其当作本USROP文件的许可依据。

## PANGAEA顶空甲烷/乙烷

[Strasser, Michael et al. (2025)，IODP386-M0091D](https://doi.org/10.1594/PANGAEA.975497)，平台明确CC BY 4.0。原文本SHA256为410bbc9869bf0f592e5d218b8d2f3ede0bffd39226aaae780642ba86fd0a2f2e，原引文/参数/许可均在PANGAEA.975497.txt内。

保留全部62条记录、31个样品位置的平行记录以及62个IGSN。深度0.21–30.82 m，基准是sediment/rock，不是DEMO-017的MD。CH4/C2H6单位ppmv。比值仅在乙烷>0时由已发表的四舍五入浓度重算，并另列发布者原比值；两者可能因数值精度不同而略有差异，不覆盖原比值。默认CH4中位数1416 ppmv，高于2倍中位数的26条是可交互的描述规则，不能解释为已知异常病因。

这是回收沉积物的顶空气体，不是循环钻井泥浆的地面气测。没有时间、泵量/接单根等操作、峰解释标签；不能套迟到算法评价，不能拿平行样当62个独立测试事件。本附加区用于真实单位、比值、采样身份及高值观察的教学。m2原来的合成事件实验仍单独运行。

## Mendeley真实岩芯外观

[Alzubaidi, Fatimah (2021)，Lithology dataset，V1](https://data.mendeley.com/datasets/b6rj29mrss/1)，DOI10.17632/b6rj29mrss.1，CC BY 4.0；原岩芯托盘照片来源Geological Survey of South Australia。发布者按2×2 cm图块组织。

从发布者test分区的limestone、sandstone、shale目录各选两个不同文件名前缀，共六张原始JPEG，57,594 bytes。不改像素，不生成UV。每张文件ID、原文件名、原下载URL、发布者SHA256、本地SHA与字节数在core-six-metadata.json/real-data-lock.json中逐张保留。图像实际尺寸有280×280和300×300，按解码尺寸计算。

m1展示实际RGB亮度/纹理等16维整块特征。矩形整块的面积/形状描述不当成天然颗粒边界。目录岩性只作来源参考，六图没有新建训练/测试评测，也没有颗粒实例金标；不把它们当成岩屑盘或荧光配对数据。

## 未采用的方向与当前空缺

查阅了[SEM公开数据](https://zenodo.org/records/5545058)等候选；成像方式和约4.8GB规模不符合本轮轻量离线像素演示，没有接入。教学图片网页也不直接用作带标签算法基准。未找到本轮可核验、许可明确、同一样品及曝光/激发条件可追溯的真实WL/UV配对，m3仍保留明示的合成配对及虚拟补充观察。

这些来源没有真实气测事件病因、现场荧光含油标签或独立地层界面真值。本轮完成了真实观测探索、来源导出与报告串联；没有现场准确率结论。

## 补充：静态教学使用的同标本白光/UV照片

按用户最新要求，后续不再以训练/等级/外部测试作为取得真实配对资料的前提。找到并下载Herbert Art Gallery and Museum, Coventry通过Wikimedia Commons提供的三张同组方解石照片：[可见光](https://commons.wikimedia.org/wiki/File:Calcite_HAGAM.jpg)、[短波UV](https://commons.wikimedia.org/wiki/File:Calcite_ShortwaveUV_HAGAM.jpg)、[长波UV](https://commons.wikimedia.org/wiki/File:Calcite_LongWaveUV_HAGAM.jpg)。三张均1429×949，合计366,994 bytes，CC BY-SA 3.0；原JPEG未修改，下载后SHA-1与发布者记录逐一核对，另存SHA256。

照片发布者明确描述同组标本。资料用于新建的portal/reference/fluorescence.html静态教学页：并排观察、切换灯源、揭示“矿物发光不等于含油”的解释。它不是含油岩屑数据集，不要求按原算法的成像条件做配准或标定；没有把曝光不同的照片拿来定量比较亮度，也没有评分或训练等级模型。既有m3独立成品未修改。原始记录在data/real/calcite-visible-uv.json，署名在CALCITE-ATTRIBUTION.txt。
