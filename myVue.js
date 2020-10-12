function model(data, linsten){
    this.data = {};

    Object.keys(data).forEach(value => {
        addabserver(data, this.data, value, linsten);
    });

    Object.seal(this.data);
};

//劫持某个变量的某个属性，添加到自定义变量中，并保持数据相同，方便以后操作
function addabserver(data, vdata, key, linsten) {
    var res = new reserve();
    linsten.forEach(lis=>{
        if (lis.exp === key)
            res.addLinsten(lis);
    });
    Object.defineProperty(vdata, key, {
        set: function (value) {
            data[key] = value;
            res.notify();
        },
        get: function () {
            return data[key];
        }
    });
};

//响应数据的变化，通知linsten运行相应的回调函数
function reserve() {
    this.linsten = [];
};
reserve.prototype.addLinsten = function(linsten){
    this.linsten.push(linsten);
};
reserve.prototype.notify = function () {
    this.linsten.forEach(linsten=>{
        linsten.run();
    });
};

//与视图链接，响应回调函数
function Listen(context, exp, cb) {
    this.context = context;
    this.exp = exp;
    this.cb = cb;
};
Listen.prototype.run = function () {
    this.cb(this.context.data[this.exp]);
};

//将观察者和响应者绑定到一起，最后只需要使用这个对象即可
function self(data, bind){
    this.data = data;

    var listens = [];
    bind.forEach(value=>{
        //响应视图变化
        if (value.type === 'input'){
            value.el.oninput = (e)=>{
                m.data[value.key] = e.target.value;
            };
            return;
        }
        //输入框响应数据变化
        if (value.type === 'value'){
            //初始化
            value.el.value = this.data[value.key];
            listens.push(new Listen(this, value.key, (data)=>{
                value.el.value = data;
            }));
            return;
        }
        //实现数据的双向绑定
        if (value.type === 'model'){
            //初始化
            value.el.value = this.data[value.key];
            value.el.oninput = (e)=>{
                m.data[value.key] = e.target.value;
            };
            listens.push(new Listen(this, value.key, (data)=>{
                value.el.value = data;
            }));
            return;
        }
        //实现视图响应数据(解析字符串中的变量,监听这些变量的改变)
        //获取字符串依赖的变量
        let keys = getKeys(value.content);
        //初始化
        if (value.content){
            let textNode = document.createTextNode(strReplace(this.data, value.content));
            value.el.appendChild(textNode);
        }
        //监听这些变量的变化
        keys.forEach((key)=>{
            listens.push(new Listen(this, key, (data)=>{
                let nodes = value.el.childNodes;
                let index = 0;
                while(index < nodes.length){
                    if (nodes[index].nodeName === '#text'){
                        value.el.removeChild(nodes[index]);
                        break;
                    }
                    index++;
                }
                let textNode = document.createTextNode(strReplace(this.data, value.content));
                value.el.appendChild(textNode);
            }));
        });
    });

    var m = new model(this.data, listens);

    return m;
}

//获取字符串的表达式的key
function getKeys(str) {
    if (!str)
        return [];
    let keys = [];
    let zf = findbds(str);
    while(zf){
        if (keys.findIndex((value)=>{return zf === value}) === -1)
            keys.push(zf);
        let end = str.indexOf('}}');
        str = str.substring(end+2);
        zf = findbds(str);
    }
    return keys;
}

//替换字符串中的所有表达式
function strReplace(data, str) {
    let zf = findbds(str);
    while(zf){
        str = str.replace('{{'+zf+'}}', data[zf]);
        zf = findbds(str);
    }
    return str;
}

//寻找表达式字符串,并返回表达式的键
function findbds(str) {
    let begin = str.indexOf('{{');
    let end = str.indexOf('}}');
    if (begin === -1 || end === -1)
        return null;
    let zf = str.substring(begin+2, end);
    return zf;
}

//用于保存数据联动
let viewtoModel = [];
//创建dom
function creatDOM(obj){
    let dom = document.createElement(obj.type);
    for (let key in obj.props){
        if (key === 'style'){
            if (typeof(obj.props[key]) === 'string'){
                dom.style = obj.props[key];
            }
            else {
                let style = "";
                for (let styleKey in obj.props[key]){
                    style += styleKey+':'+obj.props[key][styleKey]+';';
                }
                dom.style = style;
            }
        }
        else if (key.startsWith(":")){
            viewtoModel.push({el:dom, key:obj.props[key], type:key.substring(1)});
        }
        else {
            dom.setAttribute(key, obj.props[key]);
        }
    }
    obj.childrens.forEach(value=>{
        if (typeof(value) === 'string'){
            viewtoModel.push({el:dom, content:value});
            // let textNode = document.createTextNode(value);
            // dom.appendChild(textNode);
        }
        else {
            let child = creatDOM(value);
            dom.appendChild(child);
        }
    });
    return dom;
}

let that = this;
//最终使用的
function MyVue(agu) {
    //用于记录位置
    this.index = 0;

    this.agu = agu;
    this.data = {};
    this.child = {};

    //将外部定义的方法挂载到自己身上
    this.getMethod();
    this.getHtml(agu.html);
    this.init();
}
//将外部定义的方法挂载到自己身上
MyVue.prototype.getMethod = function(){
    for (let key in this.agu.method){
        that[key] = this.agu.method[key];
    }
};
//初始化
MyVue.prototype.init = function () {
    this.agu.beforeCreate && this.agu.beforeCreate.call(this);
    //获得dom结构
    let root = creatDOM(this.child);
    this.agu.created && this.agu.created.call(this);

    //将dom与数据进行绑定
    this.data = self(this.agu.data, viewtoModel).data;

    this.agu.beforeMounte && this.agu.beforeMounte.call(this);
    //将dom渲染到界面上
    this.agu.el.appendChild(root);
    this.agu.mounted && this.agu.mounted.call(this);
};
//获得HTML
MyVue.prototype.getHtml = function (html) {
    let begin = this.htmlToArray(html);
    this.child = this.scannerHtml(begin);
};
//将HTML解析成数组
MyVue.prototype.htmlToArray = function(html){
    let begin = 0;
    let array = [];
    let text = '';
    for (let i = 0; i < html.length; i++){
        if (html[i] === '<'){
            text = html.substring(begin,i).trim();
            if (text.length !== 0){
                array.push(text);
            }
            begin = i;
        }
        else if (html[i] === '>'){
            array.push(html.substring(begin,i+1));
            begin = i+1;
        }
    }
    return array;
};
//解析HTML
MyVue.prototype.scannerHtml = function (begin) {
    let dom = {};
    let thisbegin = begin[this.index];
    thisbegin = thisbegin.substring(1,thisbegin.length-1);
    thisbegin = splitStr(thisbegin);

    dom.type = thisbegin[0];
    dom.props = {};
    dom.childrens = [];
    //添加属性
    for (let i = 1; i < thisbegin.length; i++){
        let pro = thisbegin[i].split('=');
        dom.props[pro[0]] = removeyh(pro[1]);
    }
    //判断该标签是否是单标签，若是单标签，则其没有子节点,直接返回
    if (isSaginTag(begin[this.index])){
        return dom;
    }
    //添加子节点
    while (this.index < begin.length){
        this.index++;
        if (begin[this.index].startsWith('</')){
            break;
        }
        if (begin[this.index].startsWith('<')){
            dom.childrens.push(this.scannerHtml(begin));
        }
        else {
            dom.childrens.push(begin[this.index]);
        }
    }
    return dom;
};
//去掉字符串的引号
function removeyh(str) {
    if (str.startsWith('"') || str.startsWith("'")){
        return str.substring(1,str.length-1);
    }
    return str;
}
//判断一个标签是否是单标签
function isSaginTag(tag) {
    if (tag.startsWith('<input') || tag.startsWith('<img')){
        return true;
    }
    return false;
}
//按指定空格分割字符串，但是如果引号内有空格则不分割
function splitStr(str) {
    let saginyh = false;
    let doubleyh = false;
    let start = 0;
    let array = [];
    for (let i = 0; i < str.length; i++){
        if (str[i] === '"'){
            doubleyh = !doubleyh;
        }
        else if (str[i] === "'"){
            saginyh = !saginyh;
        }
        else if (str[i] === ' ' && !doubleyh && !saginyh){
            array.push(str.substring(start, i+1).trim());
            start = i+1;
        }
    }
    array.push(str.substring(start, str.length).trim());
    return array;
}