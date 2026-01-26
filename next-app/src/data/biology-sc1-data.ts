export interface BiologyPoint {
  id: string;
  chapter: string;
  title: string;
  description: string;
  pdfPath: string;
  page: number;
  priority: number;
}

export const BIOLOGY_SC1_DATA: BiologyPoint[] = [
  // 第2章：神经调节
  {
    id: "potentials",
    chapter: "第2章 神经调节",
    title: "静息电位与动作电位机制",
    description: "重点掌握 Na+ 内流与 K+ 外流的方向及转运方式。",
    pdfPath: "/Biology/普通高中教科书·生物学选择性必修1 稳态与调节.pdf",
    page: 28, // 占位符，需调整
    priority: 1
  },
  {
    id: "synapse",
    chapter: "第2章 神经调节",
    title: "突触传递的单向性",
    description: "神经递质的释放、扩散及与受体结合的过程。",
    pdfPath: "/Biology/普通高中教科书·生物学选择性必修1 稳态与调节.pdf",
    page: 31,
    priority: 1
  },
  // 第3章：体液调节
  {
    id: "glucose",
    chapter: "第3章 体液调节",
    title: "血糖调节模型",
    description: "胰岛素与胰高血糖素的相互作用。",
    pdfPath: "/Biology/普通高中教科书·生物学选择性必修1 稳态与调节.pdf",
    page: 50,
    priority: 1
  },
  {
    id: "feedback",
    chapter: "第3章 体液调节",
    title: "反馈调节与分级调节",
    description: "甲状腺激素的分级调节图谱。",
    pdfPath: "/Biology/普通高中教科书·生物学选择性必修1 稳态与调节.pdf",
    page: 52,
    priority: 1
  },
  // 第4章：免疫调节
  {
    id: "humoral-immune",
    chapter: "第4章 免疫调节",
    title: "体液免疫流程",
    description: "B细胞的活化、浆细胞分化及抗体产生。",
    pdfPath: "/Biology/普通高中教科书·生物学选择性必修1 稳态与调节.pdf",
    page: 72,
    priority: 1
  },
  {
    id: "cellular-immune",
    chapter: "第4章 免疫调节",
    title: "细胞免疫流程",
    description: "辅助性T细胞与细胞毒性T细胞的作用，细胞因子的功能。",
    pdfPath: "/Biology/普通高中教科书·生物学选择性必修1 稳态与调节.pdf",
    page: 73,
    priority: 1
  }
];
