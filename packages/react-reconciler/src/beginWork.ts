import { FiberNode } from './fiber';
import { HostComponent, HostRoot, HostText } from './workTags';
import { processUpdateQueue, UpdateQueue } from './updateQueue';
import { ReactElementType } from 'shared/ReactTypes';
import { mountChildFibers, reconcileChildFibers } from './childFibers';

/**
 * 递归中的“递”阶段
 * 对于如下结构的 reactElement：
 * <A>
 *   <B />
 * </A>
 * 当进入 A 的 beginWork 时，通过对比 B current fiberNode 与 B reactElement，生成 B 对应 wip fiberNode。
 * @param wip
 */
export const beginWork = (wip: FiberNode): FiberNode | null => {
	// 比较，再返回子 fiberNode
	switch (wip.tag) {
		// 1. 计算状态的最新值；2.创建子 fiberNode
		case HostRoot:
			return updateHostRoot(wip);
		// 创建子 fiberNode
		case HostComponent:
			return updateHostComponent(wip);
		// 没有 beginWork 流程，因为它没有子节点
		case HostText:
			return null;
		default:
			if (__DEV__) {
				console.warn('beginWork 未实现的类型', wip.tag);
			}
			return null;
	}
};

function updateHostRoot(wip: FiberNode) {
	const baseState = wip.memoizedState;
	const updateQueue = wip.updateQueue as UpdateQueue<Element>;
	const pending = updateQueue.shared.pending;
	updateQueue.shared.pending = null;
	const { memoizedState } = processUpdateQueue(baseState, pending);
	wip.memoizedState = memoizedState;

	const nextChildren = wip.memoizedState;
	reconcileChildren(wip, nextChildren);
	return wip.child;
}

function updateHostComponent(wip: FiberNode) {
	const nextProps = wip.pendingProps;
	const nextChildren = nextProps.children;
	reconcileChildren(wip, nextChildren);
	return wip.child;
}

function reconcileChildren(wip: FiberNode, children?: ReactElementType) {
	const current = wip.alternate;

	if (current !== null) {
		// 说明目前在 update 阶段
		wip.child = reconcileChildFibers(wip, current?.child, children);
	} else {
		// 说明目前在 mount 阶段
		wip.child = mountChildFibers(wip, null, children);
	}
}
