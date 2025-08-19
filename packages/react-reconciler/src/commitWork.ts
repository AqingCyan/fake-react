import { FiberNode, FiberRootNode } from './fiber';
import { MutationMask, NoFlags, Placement } from './fiberFlags';
import { HostComponent, HostRoot, HostText } from './workTags';
import { appendChildToContainer, Container } from 'hostConfig';

// 指向下一个需要执行的 Effect
let nextEffect: FiberNode | null = null;

/**
 * 处理 commit 操作中的 mutation 阶段
 * @param finishedWork
 */
export const commitMutationEffects = (finishedWork: FiberNode) => {
	nextEffect = finishedWork;

	while (nextEffect !== null) {
		// 向下遍历
		const child: FiberNode | null = nextEffect.child;

		if (
			(nextEffect.subtreeFlags & MutationMask) !== NoFlags &&
			child !== null
		) {
			nextEffect = child;
		} else {
			// 向上遍历
			nextEffect = nextEffect.sibling;
			up: while (nextEffect !== null) {
				commitMutationEffectsOnFiber(nextEffect);

				const sibling: FiberNode | null = nextEffect.sibling;

				if (sibling !== null) {
					nextEffect = sibling;
					break up;
				}

				nextEffect = nextEffect.return;
			}
		}
	}
};

function commitMutationEffectsOnFiber(finishedWork: FiberNode) {
	const flags = finishedWork.flags;

	if ((flags & MutationMask) !== NoFlags) {
		commitPlacement(finishedWork); // 执行 Placement 操作
		finishedWork.flags &= ~Placement; // 清除 Placement 标记
	}
	// flags Update
	// flags ChildDeletion
}

function commitPlacement(finishedWork: FiberNode) {
	if (__DEV__) {
		console.warn('执行 Placement 操作', finishedWork);
	}
	// 父级 DOM
	const hostParent = getHostParent(finishedWork);

	// 找到对应的 DOM，插入到父级中
	appendPlacementNodeIntoContainer(finishedWork, hostParent);
}

/**
 * 获得父级的宿主环境节点
 * @param fiber
 */
function getHostParent(fiber: FiberNode): Container {
	let parent = fiber.return;
	while (parent) {
		const parentTag = parent.tag;
		// HostComponent 或者 HostRoot
		if (parentTag === HostComponent) {
			return parent.stateNode as Container;
		}
		if (parentTag === HostRoot) {
			return (parent.stateNode as FiberRootNode).container;
		}
		parent = parent.return;
	}

	if (__DEV__) {
		console.warn('getHostParent 没有找到 HostParent');
	}
}

/**
 * 插入节点到父级 DOM 中
 * @param finishedWork
 * @param hostParent
 */
function appendPlacementNodeIntoContainer(
	finishedWork: FiberNode,
	hostParent: Container
) {
	if (finishedWork.tag === HostComponent || finishedWork.tag === HostText) {
		appendChildToContainer(finishedWork.stateNode, hostParent);
		return;
	}

	// 递归向下，直到找到第一层是 HostComponent 或者 HostText 的 Fiber 节点
	const child = finishedWork.child;
	if (child !== null) {
		appendPlacementNodeIntoContainer(child, hostParent);
		let sibling = child.sibling;

		while (sibling !== null) {
			appendPlacementNodeIntoContainer(sibling, hostParent);
			sibling = sibling.sibling;
		}
	}
}
