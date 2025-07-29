import { createWorkInProgress, FiberNode, FiberRootNode } from './fiber';
import { beginWork } from './beginWork';
import { completeWork } from './completeWork';
import { HostRoot } from './workTags';

/**
 * 需要一个全局的指向正在工作的 FiberNode 的指针
 */
let workInProgress: FiberNode | null;

const prepareFreshStack = (root: FiberRootNode) => {
	workInProgress = createWorkInProgress(root.current, {});
};

/**
 * 在 Fiber 中调度 Update
 */
export const scheduleUpdateOnFiber = (fiber: FiberNode) => {
	// TODO: 调度功能

	// fiberRootNode
	const root = markUpdateFromFiberToRoot(fiber);
	renderRoot(root);
};

/**
 * 从 Fiber 节点遍历到根节点，返回根节点
 */
function markUpdateFromFiberToRoot(fiber: FiberNode) {
	let node = fiber;
	let parent = node.return;
	while (parent !== null) {
		node = parent;
		parent = node.return;
	}

	if (node.tag === HostRoot) {
		return node.stateNode;
	}

	return null;
}

function renderRoot(root: FiberRootNode) {
	// 初始化
	prepareFreshStack(root);

	do {
		try {
			workLoop();
			break;
		} catch (e) {
			console.warn('workLoop 发生错误', e);
			workInProgress = null;
		}
	} while (true);
}

console.log(renderRoot); // TODO: 为了 commit 暂时打印，后面删除

function workLoop() {
	while (workInProgress !== null) {
		performUnitOfWork(workInProgress);
	}
}

function performUnitOfWork(fiber: FiberNode) {
	const next = beginWork(fiber);
	fiber.memoizedProps = fiber.pendingProps;

	// 递归到最深处，没有子 fiber 了
	if (next === null) {
		completeUnitOfWork(fiber);
	} else {
		workInProgress = next;
	}
}

function completeUnitOfWork(fiber: FiberNode) {
	let node: FiberNode | null = fiber;

	do {
		completeWork(node);
		const sibling = node.sibling;

		if (sibling !== null) {
			workInProgress = sibling;
			return;
		}
		node = node.return;
		workInProgress = node;
	} while (node !== null);
}
