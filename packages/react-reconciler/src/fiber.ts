import { Props, Key, Ref, ReactElementType } from 'shared/ReactTypes';
import { FunctionComponent, HostComponent, WorkTag } from './workTags';
import { Flags, NoFlags } from './fiberFlags';
import { Container } from 'hostConfig';

export class FiberNode {
	type: any;
	tag: WorkTag;
	key: Key;
	stateNode: any;
	ref: Ref;

	return: FiberNode | null;
	sibling: FiberNode | null;
	child: FiberNode | null;
	index: number;

	pendingProps: Props;
	memoizedProps: Props | null;
	memoizedState: any;
	/**
	 * alternate 是 React Fiber 架构中实现双缓冲机制的核心属性，它在每个 Fiber 节点上建立了与对应节点的双向引用关系；
	 * alternate 就是一个指针/引用，它让两棵树（Current 树和 WorkInProgress 树）中对应的节点能够互相找到对方；
	 * - React 可以通过 alternate 对比新旧状态，决定是否需要重新渲染；
	 * - 在提交阶段，React 使用 alternate 来复用 DOM 节点
	 * - 当出现错误时，React 可以通过 alternate 回退到上一个稳定状态
	 */
	alternate: FiberNode | null; // 用于 FiberNode 切换，current <=> workInProgress
	flags: Flags; // 副作用，也就是 FiberNode 标记上的具体行为
	subtreeFlags: Flags; // 子树的副作用
	updateQueue: unknown;

	constructor(tag: WorkTag, pendingProps: Props, key: Key) {
		// 作为实例
		this.tag = tag;
		this.key = key;
		this.stateNode = null; // 对于一个 HostComponent 来说，它本质是个 <div> 的话，那它就用 stateNode 保存了 div 这个 DOM
		this.type = null; // 对于一个 FunctionComponent 来说，它的 type 就是那个 function 本身

		// 作为树状结构
		this.return = null; // 指向父 fiberNode
		this.sibling = null; // 指向兄弟 fiberNode
		this.child = null; // 指向子 fiberNode
		this.index = 0; // 同级 fiberNode 的顺序，例如 <ul>li li li</ul> 中的 li 是有先后顺序的
		this.ref = null;

		// 作为工作单元
		this.pendingProps = pendingProps; // 开始准备工作的时候 props 是什么
		this.memoizedProps = null; // 工作完成时候确定下来的 props 是什么
		this.memoizedState = null; // 工作完成时候确定下来的 state 是什么
		this.updateQueue = null;

		this.alternate = null;
		this.flags = NoFlags;
		this.subtreeFlags = NoFlags;
	}
}

export class FiberRootNode {
	container: Container; // 宿主环境的 rootElement，对于浏览器环境就是 DOMElement
	current: FiberNode;
	finishedWork: FiberNode | null;

	constructor(container: Container, hostRootFiber: FiberNode) {
		this.container = container;
		this.current = hostRootFiber;
		hostRootFiber.stateNode = this;
		this.finishedWork = null;
	}
}

/**
 * 构建工作树（在内存中构建的新的 Fiber 树）
 * @param current 当前树（代表当前屏幕上显示的 UI 状态）
 * @param pendingProps
 */
export const createWorkInProgress = (
	current: FiberNode,
	pendingProps: Props
): FiberNode => {
	let wip = current.alternate;

	// 为了性能考虑，createWorkInProgress 会尽可能复用已存在的节点
	if (wip === null) {
		// mount 阶段：首次创建 WorkInProgress 节点
		wip = new FiberNode(current.tag, pendingProps, current.key);
		wip.stateNode = current.stateNode;

		// 建立双向引用
		wip.alternate = current;
		current.alternate = wip;
	} else {
		// update 阶段：复用已存在的 WorkInProgress 节点
		wip.pendingProps = pendingProps;
		wip.flags = NoFlags; // 清理上次更新的副作用，因为这个副作用可能是从上一次更新来的
		wip.subtreeFlags = NoFlags;
	}

	// 复制必要的属性
	wip.type = current.type;
	wip.updateQueue = current.updateQueue;
	wip.child = current.child;
	wip.memoizedProps = current.memoizedProps;
	wip.memoizedState = current.memoizedState;

	return wip;
};

/**
 * 根据 React 元素创建 Fiber 节点
 * @param element
 */
export const createFiberFromElement = (
	element: ReactElementType
): FiberNode => {
	const { type, key, props } = element;
	let fiberTag: WorkTag = FunctionComponent;

	if (typeof type === 'string') {
		fiberTag = HostComponent;
	} else if (typeof type !== 'function' && __DEV__) {
		console.warn('未定义的 type 类型', element);
	}

	const fiber = new FiberNode(fiberTag, props, key);
	fiber.type = type;
	return fiber;
};
