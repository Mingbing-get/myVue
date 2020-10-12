### 模拟实现vue的数据双向绑定
##### 支持
  生命周期函数(beforeCreate,created,beforeMounte,mounted)<br/>
  数据双向绑定(:model)<br/>
  class，style绑定样式<br/>
##### 使用
  引入myVue.js文件<br/>
  new MyVue({<br/>
    el:dom, //将接下来的HTML挂载到哪个dom下<br/>
    data:{}, //定义数据<br/>
    //生命周期函数直接使用<br/>
    method:{}, //定义自己的函数<br/>
    html:`` //使用字符串，定义HTML结构<br/>
  })<br/>
  具体使方式见index.html<br/>

