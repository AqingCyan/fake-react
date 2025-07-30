import { Action } from 'shared/ReactTypes';

export interface Update<State> {
	action: Action<State>; // 可以是新的状态值，也可以是状态更新函数
}

export interface UpdateQueue<State> {
	shared: {
		pending: Update<State> | null; // 等待处理的更新（简化版本只存储一个更新，真实 React 中是环形链表结构）
	};
}

/**
 * update 的实例化方法
 * 情况1：直接设置新值 const update1 = createUpdate(42); 得到 update1 = { action: 42 }
 * 情况2：设置状态更新函数 const update2 = createUpdate((prevState) => prevState + 1); 得到 update2 = { action: (prevState) => prevState + 1 }
 * @param action
 */
export const createUpdate = <State>(action: Action<State>): Update<State> => {
	return { action };
};

/**
 * createUpdateQueue 更新队列的实例化方法
 * 初始化一个空的更新队列，每个 Fiber 节点都会有自己的更新队列
 */
export const createUpdateQueue = <State>() => {
	return {
		shared: {
			pending: null
		}
	} as UpdateQueue<State>;
};

/**
 * 将更新操作插入到队列中的方法
 * 简化版本：直接覆盖，只保存最后一个更新
 * 真实 React：会维护环形链表，保存所有更新
 * @param updateQueue
 * @param update
 */
export const enqueueUpdate = <State>(
	updateQueue: UpdateQueue<State>,
	update: Update<State>
) => {
	updateQueue.shared.pending = update;
};

/**
 * 消费更新操作的方法（通过消费队列中的一个个更新操作，就能将状态从初始内容变为最新的内容）
 * @param baseState
 * @param pendingUpdate
 */
export const processUpdateQueue = <State>(
	baseState: State,
	pendingUpdate: Update<State> | null
): { memoizedState: State } => {
	const result: ReturnType<typeof processUpdateQueue<State>> = {
		memoizedState: baseState
	};

	if (pendingUpdate !== null) {
		const action = pendingUpdate.action;
		if (action instanceof Function) {
			// 情况 1：baseState 1 update 2 -> 直接换值 memoizedState 得到 2
			result.memoizedState = action(baseState);
		} else {
			// 情况 2：baseState (x) => 4x -> 直接逻辑处理值 memoizedState 得到 4
			result.memoizedState = action;
		}
	}

	return result;
};
