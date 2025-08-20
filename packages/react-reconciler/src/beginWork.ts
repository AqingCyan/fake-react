import { ReactElementType } from 'shared/ReactTypes';
import { mountChildFibers, reconcileChildFibers } from './childFibers';
import { FiberNode } from './fiber';
import { processUpdateQueue, UpdateQueue } from './updateQueue';
import {
	FunctionComponent,
	HostComponent,
	HostRoot,
	HostText
} from './workTags';
import { renderWithHooks } from './fiberHooks';

/**
 * 递归中的“递”阶段：根据 Fiber 节点的类型（tag）分派到不同的处理函数
 * 对于如下结构的 reactElement：
 * <A>
 *   <B />
 * </A>
 * 当进入 A 的 beginWork 时，通过对比 B current fiberNode 与 B reactElement，生成 B 对应 wip fiberNode。
 * @param wip work in progress - 当前正在处理的 Fiber 节点
 * @returns 子 Fiber 节点 或 null（如果没有子节点）
 */
export const beginWork = (wip: FiberNode): FiberNode | null => {
	// 比较，再返回子 fiberNode
	switch (wip.tag) {
		// 应用根节点：1. 计算状态的最新值；2.创建子 fiberNode
		case HostRoot:
			return updateHostRoot(wip);
		// 普通 DOM 元素：创建子 fiberNode
		case HostComponent:
			return updateHostComponent(wip);
		// 文本节点：没有 beginWork 流程，因为它没有子节点
		case HostText:
			return null;
		// 函数组件 TODO: 补充注释
		case FunctionComponent:
			return updateFunctionComponent(wip);
		default:
			if (__DEV__) {
				console.warn('beginWork 未实现的类型', wip.tag);
			}
			return null;
	}
};

/**
 * 更新函数组件
 * @param wip
 */
function updateFunctionComponent(wip: FiberNode) {
	// 1. 渲染函数组件，获取子节点
	const nextChildren = renderWithHooks(wip);
	// 2. 协调子节点：比较新旧子节点，生成新的子 Fiber
	reconcileChildren(wip, nextChildren);
	return wip.child;
}

/**
 * 处理根节点
 *
 * 为什么根节点特殊？
 * 根节点需要处理更新队列（updateQueue）
 * 更新队列包含了 setState、render() 等产生的更新
 * 根节点的 memoizedState 通常存储的是要渲染的 React 元素
 * @param wip
 * @returns
 */
function updateHostRoot(wip: FiberNode) {
	// 1. 获取基础状态
	const baseState = wip.memoizedState;
	// 2. 获取更新队列：从 updateQueue 中获取待处理的更新
	const updateQueue = wip.updateQueue as UpdateQueue<Element>;
	const pending = updateQueue.shared.pending;
	// 3. 清空待处理更新
	updateQueue.shared.pending = null;
	// 4. 处理更新队列
	const { memoizedState } = processUpdateQueue(baseState, pending);
	// 5. 保存新状态
	wip.memoizedState = memoizedState;

	// 对于根节点，memoizedState 存储的是要渲染的 React 元素
	// 比如当你调用 root.render(<App />) 时，<App /> 就会被存储在根节点的 memoizedState 中
	const nextChildren = wip.memoizedState;
	// // 为 <App /> 创建/更新 Fiber 节点
	reconcileChildren(wip, nextChildren);

	// 返回协调后的第一个子 Fiber 节点
	// 这个返回值告诉 workLoop 下一步要处理哪个节点
	return wip.child;
}

/**
 * 处理普通 DOM 组件
 * @param wip
 * @returns
 */
function updateHostComponent(wip: FiberNode) {
	// 1. 获取新 props
	const nextProps = wip.pendingProps;
	// 2. 提取子节点
	const nextChildren = nextProps.children;
	// 3. 协调子节点：比较新旧子节点，生成新的子 Fiber
	reconcileChildren(wip, nextChildren);
	// 4. 返回子节点
	return wip.child;
}

/**
 * 子节点协调核心
 * @param wip
 * @param children
 */
function reconcileChildren(wip: FiberNode, children?: ReactElementType) {
	// 过 wip.alternate 是否存在来判断当前是 mount 还是 update
	const current = wip.alternate;

	if (current !== null) {
		// 说明目前在 update 阶段
		// 存在对应的旧 Fiber 节点，进行 Diff 算法，复用、更新或删除节点
		wip.child = reconcileChildFibers(wip, current?.child, children);
	} else {
		// 说明目前在 mount 阶段（首次渲染）
		// 调用 mountChildFibers：创建全新的子 Fiber 节点，不需要比较直接创建
		wip.child = mountChildFibers(wip, null, children);
	}
}
