import { createFiberFromElement, FiberNode } from './fiber';
import { ReactElementType } from 'shared/ReactTypes';
import { REACT_ELEMENT_TYPE } from 'shared/ReactSymbols';
import { HostText } from './workTags';
import { Placement } from './fiberFlags';

/**
 *
 * @param shouldTrackEffects 是否需要跟踪副作用
 * @constructor
 */
const ChildReconciler = (shouldTrackEffects: boolean) => {
	const reconcileSingleElement = (
		returnFiber: FiberNode,
		_currentFirstChild: FiberNode | null,
		element: ReactElementType
	) => {
		// 根据 element 创建新的 fiberNode
		const fiber = createFiberFromElement(element);
		fiber.return = returnFiber;
		return fiber;
	};

	const reconcileSingleTextNode = (
		returnFiber: FiberNode,
		_currentFirstChild: FiberNode | null,
		content: string | number
	) => {
		// 根据 textContent 创建新的 fiberNode
		const fiber = new FiberNode(HostText, { content }, null);
		fiber.return = returnFiber;
		return fiber;
	};

	function placeSingleChild(fiber: FiberNode) {
		// 应该追踪副作用且是首屏渲染的情况下才标记操作
		if (shouldTrackEffects && fiber.alternate === null) {
			fiber.flags |= Placement;
		}
		return fiber;
	}

	return function reconcileChildFibers(
		returnFiber: FiberNode,
		currentFirstChild: FiberNode | null,
		newChild?: ReactElementType
	) {
		// 判断当前 fiber 的类型
		if (typeof newChild === 'object' && newChild !== null) {
			switch (newChild.$$typeof) {
				case REACT_ELEMENT_TYPE:
					return placeSingleChild(
						reconcileSingleElement(returnFiber, currentFirstChild, newChild)
					);
				default:
					if (__DEV__) {
						console.warn('reconcileChildFibers 未实现的类型', newChild);
					}
			}
		}

		// TODO: 多节点的情况 ul > li * 3

		// HostText 文本节点
		if (typeof newChild === 'string' || typeof newChild === 'number') {
			return placeSingleChild(
				reconcileSingleTextNode(returnFiber, currentFirstChild, newChild)
			);
		}

		if (__DEV__) {
			console.warn('reconcileChildFibers 未实现的类型', newChild);
		}
		return null;
	};
};

export const reconcileChildFibers = ChildReconciler(true);
export const mountChildFibers = ChildReconciler(false); // mount 阶段就不需要处理什么副作用
