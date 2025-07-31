import { REACT_ELEMENT_TYPE } from 'shared/ReactSymbols';
import { ReactElementType } from 'shared/ReactTypes';
import { createFiberFromElement, FiberNode } from './fiber';
import { Placement } from './fiberFlags';
import { HostText } from './workTags';

/**
 * 高阶函数工厂：根据 shouldTrackEffects 参数创建不同行为的协调器
 * @param shouldTrackEffects 是否需要跟踪副作用，true：Update 阶段，需要标记 DOM 操作；false：Mount 阶段，不需要标记（整个树都是新建的）
 * @constructor
 */
const ChildReconciler = (shouldTrackEffects: boolean) => {
	/**
	 * 处理单个 React 元素
	 * @param returnFiber 父 Fiber 节点
	 * @param _currentFirstChild 当前的子节点（这里没用到，因为目前只处理单节点）
	 * @param element 要处理的 React 元素（如 <div>、<App /> 等）
	 * @returns
	 */
	const reconcileSingleElement = (
		returnFiber: FiberNode,
		_currentFirstChild: FiberNode | null,
		element: ReactElementType
	) => {
		// 创建 Fiber 节点：根据 React 元素创建对应的 Fiber
		const fiber = createFiberFromElement(element);
		// 建立父子关系：fiber.return = returnFiber 让新 Fiber 指向父节点
		fiber.return = returnFiber;
		// 返回新 Fiber：供后续处理使用
		return fiber;
	};

	/**
	 * 处理文本节点
	 * 为什么单独处理文本？文本节点没有子节点，结构简单；不需要复杂的 createFiberFromElement 逻辑
	 * @param returnFiber
	 * @param _currentFirstChild
	 * @param content
	 * @returns
	 */
	const reconcileSingleTextNode = (
		returnFiber: FiberNode,
		_currentFirstChild: FiberNode | null,
		content: string | number
	) => {
		// 创建文本 Fiber：直接用 new FiberNode 创建 HostText 类型的节点
		// 设置内容：将文本内容包装在 { content } 对象中作为 props
		const fiber = new FiberNode(HostText, { content }, null);
		// 建立父子关系：设置 return 指针
		fiber.return = returnFiber;
		// 返回文本 Fiber
		return fiber;
	};

	/**
	 * 副作用标记
	 * @param fiber
	 * @returns
	 */
	function placeSingleChild(fiber: FiberNode) {
		// 条件1：shouldTrackEffects 为 true（Update 阶段）&& 条件2：fiber.alternate === null（这是新创建的节点）
		if (shouldTrackEffects && fiber.alternate === null) {
			// 操作：给 fiber 添加 Placement 标记
			// Placement 的意义：
			// 	 告诉 commit 阶段这个节点需要被插入到 DOM 中；
			//   在 Mount 阶段不需要这个标记，因为整个树都会被创建
			fiber.flags |= Placement;
		}
		return fiber;
	}

	/**
	 * 主协调函数
	 */
	return function reconcileChildFibers(
		returnFiber: FiberNode,
		currentFirstChild: FiberNode | null,
		newChild?: ReactElementType
	) {
		// 1. 类型判断：根据 newChild 的类型分派处理
		if (typeof newChild === 'object' && newChild !== null) {
			// 检查是否是 React 元素（通过 $$typeof）
			switch (newChild.$$typeof) {
				case REACT_ELEMENT_TYPE:
					// 创建 Fiber → 标记副作用
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

		// HostText 文本节点：处理字符串或数字
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

/**
 * 实际使用场景
 *
 * Mount 阶段示例：首次渲染 <div>Hello</div>
 * 使用 mountChildFibers (shouldTrackEffects = false)
 *
 * mountChildFibers(parentFiber, null, <div>Hello</div>)
 * ↓
 * reconcileSingleElement() // 创建 div Fiber
 * ↓
 * placeSingleChild() // 不标记 Placement（因为 shouldTrackEffects = false）
 *
 * ================================================
 *
 * Update 阶段示例：从 <div>Hello</div> 更新到 <div>World</div>
 * 使用 reconcileChildFibers (shouldTrackEffects = true)
 *
 * reconcileChildFibers(parentFiber, currentDivFiber, <div>World</div>)
 * ↓
 * reconcileSingleElement() // 创建新的 div Fiber
 * ↓
 * placeSingleChild() // 标记 Placement（因为是新节点且 shouldTrackEffects = true）
 */

export const reconcileChildFibers = ChildReconciler(true);
export const mountChildFibers = ChildReconciler(false); // mount 阶段就不需要处理什么副作用
