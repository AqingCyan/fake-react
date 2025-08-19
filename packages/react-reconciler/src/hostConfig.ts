export type Container = any;

// 临时的 createInstance 函数，假装创建。真实的情况是这些方法应该由宿主环境的包来实现
export const createInstance = (...args: any) => {
	console.log(args);
	return {} as any;
};

// 临时的 appendInitialChild 函数，假装添加。真实的情况是这些方法应该由宿主环境的包来实现
export const appendInitialChild = (...args: any) => {
	console.log(args);
	return {} as any;
};

// 临时的 createTextInstance 函数，假装创建。真实的情况是这些方法应该由宿主环境的包来实现
export const createTextInstance = (...args: any) => {
	console.log(args);
	return {} as any;
};

// 临时的 appendChildToContainer 函数，假装添加。真实的情况是这些方法应该由宿主环境的包来实现
export const appendChildToContainer = (...args: any) => {
	console.log(args);
};
