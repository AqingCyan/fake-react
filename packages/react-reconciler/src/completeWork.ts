import {
	appendInitialChild,
	Container,
	createInstance,
	createTextInstance
} from 'hostConfig';
import { FiberNode } from './fiber';
import { NoFlags } from './fiberFlags';
import { HostComponent, HostRoot, HostText } from './workTags';

/**
 * 负责 React 协调过程中的"归"阶段（向上回溯），主要工作是：
 * 1. 构建 DOM 结构：创建真实的 DOM 节点
 * 2. 组装 DOM 树：将子 DOM 节点插入到父节点中
 * 3. 冒泡副作用：将子节点的 flags 向上传递
 *
 * 与 beginWork 形成完美配合：
 *   beginWork：向下遍历，创建 Fiber 节点
 *   completeWork：向上回溯，创建 DOM 节点
 *
 * 最终结果：构建出完整的离屏 DOM 树，等待 commit 阶段插入到页面中。
 */

/**
 * 主完成函数
 * @param wip
 * @returns
 */
export const completeWork = (wip: FiberNode): FiberNode | null => {
	// 获取 props
	const newProps = wip.pendingProps;
	// 获取旧节点
	const current = wip.alternate;

	// 类型分派
	switch (wip.tag) {
		case HostComponent:
			if (current !== null && wip.stateNode) {
				// TODO: update 阶段
			} else {
				// 首屏渲染的阶段
				// 1. 创建 DOM 节点
				const instance = createInstance(wip.type, newProps);
				// 2. 将 DOM 插入到 DOM 树中
				appendAllChildren(instance, wip);
				// 将创建的 DOM 节点保存到 Fiber 的 stateNode 中
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
				// 1. 创建文本节点；
				// 2. 直接保存：文本节点没有子节点，直接保存到 stateNode
				wip.stateNode = createTextInstance(newProps.content);
			}
			bubbleProperties(wip);
			return null;
		case HostRoot:
			// 根节点不需要创建 DOM（container 已经存在），只需要冒泡子节点的副作用标记
			bubbleProperties(wip);
			return null;
		default:
			if (__DEV__) {
				console.warn('未处理的 completeWork 情况', wip.tag);
			}
	}

	// 返回 null：表示当前节点处理完毕，继续向上回溯
	return null;
};

/**
 * 组装 DOM 树
 * 收集当前 Fiber 节点的所有直接 DOM 子节点，并插入到父 DOM 节点中
 * 关键点是"直接 DOM 子节点"，这意味着要跳过 React 组件节点，只收集真正的 DOM 节点
 * @param parent 要插入子节点的父 DOM 节点（实际上是 parent.stateNode）
 * @param wip 当前正在处理的 Fiber 节点
 * @returns
 */
function appendAllChildren(parent: Container, wip: FiberNode) {
	// 1. 从第一个子节点开始
	let node = wip.child;

	// 2. 遍历所有后代节点
	while (node !== null) {
		// 如果当前节点是 HostComponent（DOM 元素）或 HostText（文本节点）
		if (node.tag === HostComponent || node.tag === HostText) {
			// 直接调用 appendInitialChild(parent, node.stateNode) 插入 DOM
			appendInitialChild(parent, node.stateNode);
			// 如果是组件节点（如 FunctionComponent、ClassComponent），不是真正的 DOM
		} else if (node.child !== null) {
			// 设置正确的 return 指针
			node.child.return = node;
			// 继续向下寻找：node = node.child
			node = node.child;
			// 继续下一轮循环
			continue;
		}

		// 如果遍历回到了起始节点 wip，说明整个子树遍历完毕，直接返回
		if (node === wip) {
			return;
		}

		// 算法最复杂的部分，处理当前节点没有子节点时的遍历逻辑
		// 内部 while 循环：向上回溯
		// 如果当前节点没有兄弟节点
		while (node.sibling === null) {
			// 直到找到有兄弟节点的祖先节点，或者回到起始节点 wip
			if (node.return === null || node.return === wip) {
				return;
			}
			// 向上回溯到父节点
			node = node.return;
		}
		// 设置兄弟节点的 return 指针
		node.sibling.return = node.return;
		// 移动到兄弟节点
		node = node.sibling;
	}
}

/**
 * 副作用冒泡，将子节点的副作用标记向上传递
 * 需要冒泡副作用的原因：commit 阶段需要知道哪些子树有副作用；避免遍历没有变更的子树，提高性能；
 * @param wip
 */
function bubbleProperties(wip: FiberNode) {
	let subtreeFlags = NoFlags;
	let child = wip.child;

	while (child !== null) {
		subtreeFlags |= child.subtreeFlags; // 收集子树的 flags
		subtreeFlags |= child.flags; // 收集子节点的 flags

		child.return = wip; // 确保 return 指针正确
		child = child.sibling; // 遍历所有兄弟节点
	}

	wip.subtreeFlags |= subtreeFlags; // 将收集的 flags 保存到当前节点
}
