export type Container = Element;
export type Instance = Element;

/**
 * 创建一个实例
 * @param type
 * @param props
 */
export const createInstance = (type: string, props: any): Element => {
	// TODO 处理 props
	console.log(props);
	const element = document.createElement(type);
	return element;
};

/**
 *
 * @param parent
 * @param child
 */
export const appendInitialChild = (
	parent: Instance | Container,
	child: Instance
) => {
	parent.appendChild(child);
};

/**
 * 创建一个文本实例
 * @param content
 */
export const createTextInstance = (content: string) => {
	return document.createTextNode(content);
};

/**
 * 向容器添加子节点
 * @param container
 * @param child
 */
export const appendChildToContainer = appendInitialChild;
