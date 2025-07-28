export type WorkTag =
	| typeof FunctionComponent
	| typeof HostRoot
	| typeof HostComponent
	| typeof HostText;

export const FunctionComponent = 0; // 函数组件
export const HostRoot = 3; // 项目挂载的根节点 ReactDom.render()
export const HostComponent = 5; // 原生的 HTML 标签 <div></div>
export const HostText = 6; // 文本 <div>123</div> 中的 123 部分
