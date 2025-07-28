import { Props, Key, Ref } from 'shared/ReactTypes';
import { WorkTag } from './workTags';
import { Flags, NoFlags } from './fiberFlags';

export class FiberNode {
	type: any;
	tag: WorkTag;
	key: Key;
	stateNode: any;
	ref: Ref;

	return: FiberNode | null;
	sibling: FiberNode | null;
	child: FiberNode | null;
	index: number;

	pendingProps: Props;
	memoizedProps: Props | null;
	alternate: FiberNode | null; // 用于 FiberNode 切换，current => workInProgress
	flags: Flags; // 副作用，也就是 FiberNode 标记上的具体行为

	constructor(tag: WorkTag, pendingProps: Props, key: Key) {
		// 作为实例
		this.tag = tag;
		this.key = key;
		this.stateNode = null; // 对于一个 HostComponent 来说，它本质是个 <div> 的话，那它就用 stateNode 保存了 div 这个 DOM
		this.type = null; // 对于一个 FunctionComponent 来说，它的 type 就是那个 function 本身

		// 作为树状结构
		this.return = null; // 指向父 fiberNode
		this.sibling = null; // 指向兄弟 fiberNode
		this.child = null; // 指向子 fiberNode
		this.index = 0; // 同级 fiberNode 的顺序，例如 <ul>li li li</ul> 中的 li 是有先后顺序的
		this.ref = null;

		// 作为工作单元
		this.pendingProps = pendingProps; // 开始准备工作的时候 props 是什么
		this.memoizedProps = null; // 工作完成时候确定下来的 props 是什么

		this.alternate = null;
		this.flags = NoFlags;
	}
}
