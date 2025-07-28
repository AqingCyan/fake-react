// 递归中的“递”阶段
import { FiberNode } from './fiber';

export const beginWork = (fiber: FiberNode): FiberNode | null => {
	// 比较，再返回子 fiberNode
	console.log(fiber);
	return null;
};
