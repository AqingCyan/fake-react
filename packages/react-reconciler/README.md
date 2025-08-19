## 示例场景

假设我们要渲染这样一个简单的应用：

```jsx
// 应用代码
const App = () => {
	return (
		<div className="container">
			<span>Hello</span>
			World
		</div>
	);
};

// 渲染代码
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
```

## 完整流程调用链

### 阶段1：应用初始化

#### 1.1 `createContainer` 调用

```typescript
// fiberReconciler.ts: createContainer()
export const createContainer = (container: Container) => {
	// 创建根 Fiber 节点
	const hostRootFiber = new FiberNode(HostRoot, {}, null);
	// 创建 FiberRoot 容器
	const root = new FiberRootNode(container, hostRootFiber);
	// 初始化更新队列
	hostRootFiber.updateQueue = createUpdateQueue();

	return root;
};
```

**内部调用**：

- `new FiberNode(HostRoot, {}, null)` - 创建根 Fiber
- `new FiberRootNode(container, hostRootFiber)` - 创建容器
- `createUpdateQueue()` - 初始化更新队列

**结果**：创建了应用的基础设施，建立了 FiberRoot 和根 Fiber 的关系。

### 阶段2：触发首次渲染

#### 2.1 `updateContainer` 调用

```typescript
// fiberReconciler.ts: updateContainer()
export const updateContainer = (
	element: ReactElementType | null, // <App />
	root: FiberRootNode
) => {
	const hostRootFiber = root.current;
	// 创建更新对象：{ action: <App /> }
	const update = createUpdate<ReactElementType | null>(element);
	// 将更新加入队列
	enqueueUpdate(hostRootFiber.updateQueue, update);

	// 🔥 关键：开始调度渲染
	scheduleUpdateOnFiber(hostRootFiber);

	return element;
};
```

**内部调用**：

- `createUpdate(<App />)` - 创建更新对象
- `enqueueUpdate()` - 将 `<App />` 放入根节点的更新队列
- `scheduleUpdateOnFiber(hostRootFiber)` - 开始工作循环

### 阶段3：工作循环开始

#### 3.1 `scheduleUpdateOnFiber` 调用

```typescript
// workLoop.ts: scheduleUpdateOnFiber()
export const scheduleUpdateOnFiber = (fiber: FiberNode) => {
	// 找到根节点
	const root = markUpdateFromFiberToRoot(fiber);
	// 开始渲染
	renderRoot(root);
};
```

#### 3.2 `markUpdateFromFiberToRoot` 调用

```typescript
// workLoop.ts: markUpdateFromFiberToRoot()
function markUpdateFromFiberToRoot(fiber: FiberNode) {
	let node = fiber;
	let parent = node.return;
	// 向上遍历到根节点
	while (parent !== null) {
		node = parent;
		parent = node.return;
	}
	// 返回 FiberRootNode
	if (node.tag === HostRoot) {
		return node.stateNode;
	}
	return null;
}
```

#### 3.3 `renderRoot` 调用

```typescript
// workLoop.ts: renderRoot()
function renderRoot(root: FiberRootNode) {
	// 准备工作树
	prepareFreshStack(root);

	do {
		try {
			workLoop(); // 🔥 核心工作循环
			break;
		} catch (e) {
			console.warn('workLoop 发生错误', e);
			workInProgress = null;
		}
	} while (true);

	// 保存完成的工作
	root.finishedWork = root.current.alternate;
}
```

#### 3.4 `prepareFreshStack` 调用

```typescript
// workLoop.ts: prepareFreshStack()
const prepareFreshStack = (root: FiberRootNode) => {
	// 创建工作树的根节点
	workInProgress = createWorkInProgress(root.current, {});
};
```

**内部调用**：

- `createWorkInProgress()` - 创建根节点的工作副本

### 阶段4：Fiber 树协调（递阶段）

#### 4.1 `workLoop` 开始

```typescript
// workLoop.ts: workLoop()
function workLoop() {
	while (workInProgress !== null) {
		performUnitOfWork(workInProgress); // 处理每个工作单元
	}
}
```

#### 4.2 处理根节点 - `performUnitOfWork(hostRootFiber)`

```typescript
// workLoop.ts: performUnitOfWork()
function performUnitOfWork(fiber: FiberNode) {
	// 🔥 向下递归
	const next = beginWork(fiber);
	fiber.memoizedProps = fiber.pendingProps;

	if (next === null) {
		completeUnitOfWork(fiber); // 开始归阶段
	} else {
		workInProgress = next; // 继续处理子节点
	}
}
```

#### 4.3 `beginWork(hostRootFiber)` - 处理根节点

```typescript
// beginWork.ts: beginWork() -> updateHostRoot()
function updateHostRoot(wip: FiberNode) {
	const baseState = wip.memoizedState; // null
	const updateQueue = wip.updateQueue;
	const pending = updateQueue.shared.pending; // { action: <App /> }
	updateQueue.shared.pending = null;

	// 🔥 处理更新队列，得到 <App />
	const { memoizedState } = processUpdateQueue(baseState, pending);
	wip.memoizedState = memoizedState; // <App />

	// 🔥 协调子节点：为 <App /> 创建 Fiber
	const nextChildren = wip.memoizedState; // <App />
	reconcileChildren(wip, nextChildren);
	return wip.child; // 返回 App Fiber
}
```

**内部调用**：

- `processUpdateQueue()` - 处理更新队列，得到 `<App />`
- `reconcileChildren()` - 为 `<App />` 创建 Fiber 节点

#### 4.4 `reconcileChildren` 调用

```typescript
// beginWork.ts: reconcileChildren()
function reconcileChildren(wip: FiberNode, children?: ReactElementType) {
	const current = wip.alternate;

	if (current !== null) {
		// Update 阶段
		wip.child = reconcileChildFibers(wip, current?.child, children);
	} else {
		// Mount 阶段（首次渲染）
		wip.child = mountChildFibers(wip, null, children); // 🔥
	}
}
```

#### 4.5 `mountChildFibers` 调用

```typescript
// childFibers.ts: mountChildFibers()
// 实际调用 ChildReconciler(false) 返回的函数
function reconcileChildFibers(
	returnFiber: FiberNode, // hostRootFiber
	currentFirstChild: FiberNode | null, // null
	newChild?: ReactElementType // <App />
) {
	// newChild 是 <App /> 对象
	if (typeof newChild === 'object' && newChild !== null) {
		switch (newChild.$$typeof) {
			case REACT_ELEMENT_TYPE:
				return placeSingleChild(
					reconcileSingleElement(returnFiber, currentFirstChild, newChild)
				);
		}
	}
}
```

**内部调用**：

- `reconcileSingleElement()` - 为 `<App />` 创建 Fiber
- `placeSingleChild()` - 标记副作用（Mount 阶段不标记）

#### 4.6 继续处理 App 组件

**下一次 `performUnitOfWork(appFiber)`**：

```typescript
// workInProgress 现在指向 App Fiber
const next = beginWork(appFiber); // 返回 div Fiber
```

**`beginWork(appFiber)` 会走到默认分支**（因为 App 是 FunctionComponent，当前代码还没实现）

#### 4.7 处理 div 节点 - `beginWork(divFiber)`

```typescript
// beginWork.ts: updateHostComponent()
function updateHostComponent(wip: FiberNode) {
	const nextProps = wip.pendingProps; // { className: "container", children: [...] }
	const nextChildren = nextProps.children; // [<span>Hello</span>, "World"]
	reconcileChildren(wip, nextChildren);
	return wip.child; // 返回 span Fiber
}
```

#### 4.8 处理 span 节点 - `beginWork(spanFiber)`

```typescript
// 类似 div 的处理
const nextChildren = spanFiber.pendingProps.children; // "Hello"
reconcileChildren(spanFiber, 'Hello');
return spanFiber.child; // 返回 "Hello" 文本 Fiber
```

#### 4.9 处理文本节点 - `beginWork(textFiber)`

```typescript
// beginWork.ts:
case HostText:
  return null;  // 文本节点没有子节点
```

### 阶段5：Fiber 树完成（归阶段）

#### 5.1 开始 `completeUnitOfWork`

当 `beginWork` 返回 `null` 时，开始归阶段：

```typescript
// workLoop.ts: completeUnitOfWork()
function completeUnitOfWork(fiber: FiberNode) {
	// 从 "Hello" 文本节点开始
	let node: FiberNode | null = fiber;

	do {
		completeWork(node); // 🔥 完成当前节点
		const sibling = node.sibling;

		if (sibling !== null) {
			workInProgress = sibling; // 处理兄弟节点
			return;
		}
		node = node.return; // 向上回溯
		workInProgress = node;
	} while (node !== null);
}
```

#### 5.2 `completeWork("Hello"文本节点)`

```typescript
// completeWork.ts: completeWork()
case HostText:
  if (current !== null && wip.stateNode) {
    // Update 阶段
  } else {
    // Mount 阶段：创建文本 DOM
    wip.stateNode = createTextInstance(newProps.content);  // 🔥
  }
  bubbleProperties(wip);
  return null;
```

**内部调用**：

- `createTextInstance("Hello")` - 创建文本 DOM 节点
- `bubbleProperties()` - 冒泡副作用

#### 5.3 回到 span 节点，`completeWork(spanFiber)`

```typescript
case HostComponent:
  if (current !== null && wip.stateNode) {
    // Update 阶段
  } else {
    // Mount 阶段：创建 span DOM
    const instance = createInstance(wip.type, newProps);  // 🔥
    appendAllChildren(instance, wip);  // 🔥 插入子节点
    wip.stateNode = instance;
  }
  bubbleProperties(wip);
  return null;
```

**内部调用**：

- `createInstance("span", props)` - 创建 span DOM 元素
- `appendAllChildren()` - 将 "Hello" 文本插入到 span 中
- `bubbleProperties()` - 冒泡副作用

#### 5.4 处理 "World" 文本节点

回到 `completeUnitOfWork`，发现 span 有兄弟节点 "World"，继续处理...

#### 5.5 继续向上，处理 div、App、hostRoot

每个节点都会调用 `completeWork`，创建对应的 DOM 并组装DOM树。

### 阶段6：完成渲染

#### 6.1 `workLoop` 结束

当 `workInProgress` 变为 `null` 时，`workLoop` 结束。

#### 6.2 保存完成的工作

```typescript
// renderRoot() 最后
root.finishedWork = root.current.alternate; // 保存完成的工作树
```

## 完整的调用栈总结

```
1. createContainer()
   └── new FiberNode(HostRoot)
   └── new FiberRootNode()
   └── createUpdateQueue()

2. updateContainer(<App />)
   └── createUpdate(<App />)
   └── enqueueUpdate()
   └── scheduleUpdateOnFiber()

3. scheduleUpdateOnFiber()
   └── markUpdateFromFiberToRoot()
   └── renderRoot()

4. renderRoot()
   └── prepareFreshStack()
       └── createWorkInProgress()
   └── workLoop()

5. workLoop()
   └── performUnitOfWork() (循环)
       └── beginWork() (递阶段)
           ├── updateHostRoot()
           ├── updateHostComponent()
           └── reconcileChildren()
               └── mountChildFibers()
                   └── reconcileSingleElement()
       └── completeUnitOfWork() (归阶段)
           └── completeWork()
               ├── createInstance()
               ├── createTextInstance()
               ├── appendAllChildren()
               └── bubbleProperties()
```

## 最终结果

经过这个完整流程，React 会：

1. **构建 Fiber 树**：表示组件的结构关系
2. **构建 DOM 树**：在内存中创建真实的 DOM 结构
3. **准备提交**：`finishedWork` 包含了完整的可提交的工作树

目前的实现缺少 **commit 阶段**，真实应用中还需要将构建好的 DOM 树插入到页面中。

这就是当前代码实现的完整 React 渲染流程！
