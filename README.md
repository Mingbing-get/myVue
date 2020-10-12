### 模拟实现vue的数据双向绑定
##### 支持
  生命周期函数(beforeCreate,created,beforeMounte,mounted)
  数据双向绑定(:model)
  class，style绑定样式
##### 使用
  引入myVue.js文件
  new MyVue({
    el:dom, //将接下来的HTML挂载到哪个dom下
    data:{}, //定义数据
    //生命周期函数直接使用
    method:{}, //定义自己的函数
    html:`` //使用字符串，定义HTML结构
  })
  具体使方式见index.html

