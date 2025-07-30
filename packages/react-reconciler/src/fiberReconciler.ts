import { Container } from 'hostConfig';
import { FiberNode, FiberRootNode } from './fiber';
import { HostRoot } from './workTags';
import {
	createUpdate,
	createUpdateQueue,
	enqueueUpdate,
	UpdateQueue
} from './updateQueue';
import { ReactElementType } from 'shared/ReactTypes';
import { scheduleUpdateOnFiber } from './workLoop';

/**
 * 调用顺序
 * Legacy API，React18之后被废弃
 * ReactDOM.render(<App />, document.getElementById('root'));
 *
 * 内部调用链：
 * legacyRenderSubtreeIntoContainer()
 * └── legacyCreateRootFromDOMContainer()
 *     └── createContainer()           // 创建容器
 *         └── updateContainer()       // 初始渲染
 *
 *
 * Modern API，React18的 API
 * const root = ReactDOM.createRoot(document.getElementById('root'));
 * root.render(<App />);
 *
 * 内部调用链：
 * createRoot()
 * └── createContainer()               // 创建容器
 * ReactDOMRoot.prototype.render()
 * └── updateContainer()               // 渲染更新
 */

/**
 * 负责创建和初始化一个 Fiber Root 容器，这是 React 应用的根基础设施
 * @param container
 */
export const createContainer = (container: Container) => {
	/**
	 * 创建根 Fiber 节点，HostRoot 是一个特殊的 Fiber 类型，表示这是应用的根容器；{} 是空的 props（根节点通常没有 props）；null 是 key（根节点不需要 key）
	 * 这个节点将成为整个组件树的根
	 *    hostRootFiber (HostRoot)
	 *            |
	 *       App Component
	 *         /       \
	 *    Header     Content
	 *      |          |
	 *   NavBar    MainContent
	 */
	const hostRootFiber = new FiberNode(HostRoot, {}, null);
	// 创建 FiberRoot：这是管理整个应用的容器对象，container 是实际的 DOM 容器（如 document.getElementById('root')），hostRootFiber 是刚创建的根 Fiber 节点
	const root = new FiberRootNode(container, hostRootFiber);
	// 初始化更新队列：为根 Fiber 节点创建更新队列；更新队列用于存储待处理的更新（如 setState 产生的更新）；根节点的更新队列会处理整个应用的渲染请求
	hostRootFiber.updateQueue = createUpdateQueue();

	return root;
};

/**
 * 负责将更新请求调度到 Fiber Root 上，触发组件树的重新渲染
 *
 * 如果发生 setState 内部会调用：
 * dispatchSetState()
 * └── scheduleUpdateOnFiber()
 *     └── ensureRootIsScheduled()     // 确保根节点被调度
 *         └── performConcurrentWorkOnRoot() // 执行并发工作
 * @param element
 * @param root
 */
export const updateContainer = (
	element: ReactElementType | null,
	root: FiberRootNode
) => {
	// 获取当前根 Fiber 节点：从 FiberRootNode 中获取当前的根 Fiber 节点；root.current 指向当前显示的 Fiber 树的根节点；这是双缓冲机制中的"当前树"；
	const hostRootFiber = root.current;
	// 创建一个 Update 对象，包含要更新的内容；element 是要渲染的 React 元素（如 <App />）；这个更新对象会被加入到更新队列中
	const update = createUpdate<ReactElementType | null>(element);
	// 将刚创建的更新对象添加到根 Fiber 的更新队列中
	enqueueUpdate(
		hostRootFiber.updateQueue as UpdateQueue<ReactElementType | null>,
		update
	);

	// 启动 Fiber 树的调度和渲染流程；这是从"创建更新"到"实际渲染"的关键步骤；会触发整个 React 的工作循环，包括协调（reconciliation）和提交（commit）阶段
	scheduleUpdateOnFiber(hostRootFiber);

	// 返回传入的 React 元素，在某些场景下，调用者可能需要知道实际更新的元素
	return element;
};
