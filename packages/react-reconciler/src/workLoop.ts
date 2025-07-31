import { beginWork } from './beginWork';
import { completeWork } from './completeWork';
import { createWorkInProgress, FiberNode, FiberRootNode } from './fiber';
import { HostRoot } from './workTags';

/**
 * 整体工作流程
 * 1. 触发更新 → scheduleUpdateOnFiber
 * 2. 找到根节点 → markUpdateFromFiberToRoot
 * 3. 开始渲染 → renderRoot
 * 4. 准备工作树 → prepareFreshStack
 * 5. 工作循环 → workLoop
 * 6. 处理节点 → performUnitOfWork + beginWork
 * 7. 完成节点 → completeUnitOfWork + completeWork
 */

// 这是一个全局指针，指向当前正在处理的 Fiber 节点。React 通过这个指针来跟踪当前的工作进度
let workInProgress: FiberNode | null;

/**
 * 新的渲染工作准备一个全新的工作栈
 * 接收 FiberRootNode（整个应用的根节点）
 * 调用 createWorkInProgress 创建当前 Fiber 树的副本（这就是双缓冲技术）
 * 将 workInProgress 指向这个新创建的工作树的根节点
 * @param root
 */
const prepareFreshStack = (root: FiberRootNode) => {
	workInProgress = createWorkInProgress(root.current, {});
};

/**
 * 在 Fiber 中调度 Update
 * 这是更新的入口函数，当组件调用 setState 时会触发
 * @param fiber 触发更新的 Fiber 节点
 */
export const scheduleUpdateOnFiber = (fiber: FiberNode) => {
	// TODO: 调度功能，这里应该实现时间切片等调度逻辑

	// 通过 markUpdateFromFiberToRoot 找到应用的根节点
	const root = markUpdateFromFiberToRoot(fiber);
	// 调用 renderRoot 开始渲染过程
	renderRoot(root);
};

/**
 * 从任意 Fiber 节点向上遍历到根节点
 * @param fiber 从当前 fiber 节点开始
 */
function markUpdateFromFiberToRoot(fiber: FiberNode) {
	let node = fiber;
	// 通过 return 属性（指向父节点）向上遍历，一直遍历到根节点（parent 为 null）
	let parent = node.return;
	while (parent !== null) {
		node = parent;
		parent = node.return;
	}

	// 检查是否是 HostRoot 类型（应用根节点）
	if (node.tag === HostRoot) {
		// 返回根节点的 stateNode（FiberRootNode）
		return node.stateNode;
	}

	return null;
}

/**
 * 渲染的主函数，协调整个渲染过程
 * @param root
 */
function renderRoot(root: FiberRootNode) {
	// 调用 prepareFreshStack 准备工作树
	prepareFreshStack(root);

	do {
		try {
			workLoop();
			break;
		} catch (e) {
			if (__DEV__) {
				console.warn('workLoop 发生错误', e);
			}
			workInProgress = null;
		}
	} while (true);

	// 将完成的工作树（alternate）赋值给 finishedWork
	root.finishedWork = root.current.alternate;

	// 根据 wip fiberNode 树中的 flags 确定是否 commit，来完成渲染
	// commitRoot(root)
}

/**
 * 核心工作循环，遍历整个 Fiber 树
 * 检查 workInProgress 是否为 null
 * 如果不为 null，调用 performUnitOfWork 处理当前节点
 * 重复直到所有节点都处理完毕
 */
function workLoop() {
	while (workInProgress !== null) {
		performUnitOfWork(workInProgress);
	}
}

/**
 * 处理单个 Fiber 节点的工作单元
 * @param fiber
 */
function performUnitOfWork(fiber: FiberNode) {
	// 向下递归：调用 beginWork(fiber) 处理当前节点，返回子节点
	const next = beginWork(fiber);
	// 保存 props：将 pendingProps 保存到 memoizedProps
	fiber.memoizedProps = fiber.pendingProps;

	// 递归到最深处，没有子 fiber 了
	if (next === null) {
		// 如果 next 为 null：说明没有子节点，调用 completeUnitOfWork 开始向上归并
		completeUnitOfWork(fiber);
	} else {
		// 如果有子节点：将 workInProgress 指向子节点，继续向下处理
		workInProgress = next;
	}
}

/**
 * 完成工作单元，实现向上归并和兄弟节点遍历
 * @param fiber
 * @returns
 */
function completeUnitOfWork(fiber: FiberNode) {
	let node: FiberNode | null = fiber;

	do {
		// 完成当前节点
		completeWork(node);
		// 查找兄弟节点
		const sibling = node.sibling;

		// 处理兄弟节点：如果有兄弟节点，将 workInProgress 指向兄弟节点并返回
		if (sibling !== null) {
			workInProgress = sibling;
			return;
		}
		// 向上返回：如果没有兄弟节点，通过 return 指针向上返回到父节点
		node = node.return;
		workInProgress = node;
	} while (node !== null); // 重复这个过程直到回到根节点
}
