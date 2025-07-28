// 递归中的“归”阶段
import { FiberNode } from './fiber';

export const completeWork = (fiber: FiberNode): FiberNode | null => {
	console.log(fiber);
	return null;
};
