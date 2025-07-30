import { FiberNode } from './fiber';
import { HostComponent, HostRoot, HostText } from './workTags';
import {
	appendInitialChild,
	createInstance,
	createTextInstance
} from 'hostConfig';
import { NoFlags } from './fiberFlags';

// 递归中的“归”阶段
// 对于 Host 类型的 fiberNode，需要构建离屏的 DOM 树
// TODO: 标记 update flag
export const completeWork = (wip: FiberNode): FiberNode | null => {
	const newProps = wip.pendingProps;
	const current = wip.alternate;

	switch (wip.tag) {
		case HostComponent:
			if (current !== null && wip.stateNode) {
				// update 阶段
			} else {
				// 首屏渲染的阶段
				// 1. 构建 DOM；
				const instance = createInstance(wip.type, newProps);
				// 2. 将 DOM 插入到 DOM 树中
				appendAllChildren(instance, wip);
				wip.stateNode = instance;
			}
			bubbleProperties(wip);
			return null;
		// 1. 构建 DOM；2. 将 DOM 插入到 DOM 树中
		case HostText:
			if (current !== null && wip.stateNode) {
				// update 阶段
			} else {
				// 首屏渲染的阶段
				// 1. 构建 DOM；2. 将 DOM 插入到 DOM 树中
				wip.stateNode = createTextInstance(newProps.content);
			}
			bubbleProperties(wip);
			return null;
		case HostRoot:
			bubbleProperties(wip);
			return null;
		default:
			if (__DEV__) {
				console.warn('未处理的 completeWork 情况', wip.tag);
			}
	}

	return null;
};

function appendAllChildren(parent: FiberNode, wip: FiberNode) {
	let node = wip.child;

	while (node !== null) {
		if (node.tag === HostComponent || node.tag === HostText) {
			appendInitialChild(parent, node.stateNode);
		} else if (node.child !== null) {
			node.child.return = node;
			node = node.child;
			continue;
		}

		if (node === wip) {
			return;
		}

		// 往下找没找着，兄弟节点也没有，就该往上归了
		while (node.sibling === null) {
			if (node.return === null || node.return === wip) {
				return;
			}
			node = node.return;
		}
		node.sibling.return = node.return;
		node = node.sibling;
	}
}

function bubbleProperties(wip: FiberNode) {
	let subtreeFlags = NoFlags;
	let child = wip.child;

	while (child !== null) {
		subtreeFlags |= child.subtreeFlags;
		subtreeFlags |= child.flags;

		child.return = wip;
		child = child.sibling;
	}

	wip.subtreeFlags |= subtreeFlags;
}
