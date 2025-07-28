import { Action } from 'shared/ReactTypes';

export interface Update<State> {
	action: Action<State>;
}

export interface UpdateQueue<State> {
	shared: {
		pending: Update<State> | null;
	};
}

/**
 * update 的实例化方法
 * @param action
 */
export const createUpdate = <State>(action: Action<State>): Update<State> => {
	return { action };
};

/**
 * createUpdateQueue 更新队列的实例化方法
 */
export const createUpdateQueue = <Action>() => {
	return {
		shared: {
			pending: null
		}
	} as UpdateQueue<Action>;
};

/**
 * 将更新操作插入到队列中的方法
 * @param updateQueue
 * @param update
 */
export const enqueueUpdate = <Action>(
	updateQueue: UpdateQueue<Action>,
	update: Update<Action>
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
