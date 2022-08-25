
class Kvue {
    constructor(options){
        this.$options = options;
        this._data = options.data;
        this.observe(this._data);
        this.compile();
    }
    observe(data){
        let keys = Object.keys(data);
        let _this = this;
        keys.forEach(key=>{
            let value = data[key];
            let dep = new Dep();
            Object.defineProperty(data,key,{
                configurable:true,
                emumerable:true,
                get(){
                    console.log('get');
                    //收集watcher
                    if(Dep.target){
                        dep.addSub(Dep.target);
                    }
                    return value;
                },
                set(newValue){
                    console.log('set');
                    //在这个地方我们还需要实现视图的更新，也就是在这里实现类似compile这个方法，但是我们如何通过set之后触发呢，在这里我们使用观察者模式来实现
                    // _this.dispatchEvent(new CustomEvent(key,{
                    //     detail:newValue
                    // }))
                    //执行watcher
                    dep.notify(newValue);
                    value = newValue
                }
            })
        })
    }
    compile(){
        let ele = document.querySelector(this.$options.el);
        this.compileNodes(ele);
    }
    compileNodes(ele){
        let childNodes = ele.childNodes
        childNodes.forEach(item=>{
            if(item.nodeType === 1){
                //元素节点
                if(item.childNodes.length>0){
                    //通过递归的方式来处理多层数据，直到找到文本节点
                    this.compileNodes(item)
                }
            }else if(item.nodeType === 3){
                //文本节点
                // [^{}\s] :表示不能存在{}和空格
                let reg = /\{\{\s*([^{}\s]+)\s*\}\}/g
                let textContent = item.textContent;
                if(reg.test(textContent)){
                    let $1 = RegExp.$1;
                    //正则匹配里面的replace方法 
                    item.textContent = item.textContent.replace(reg,this._data[$1]);

                    //事件监听
                    // this.addEventListener($1,(e)=>{
                    //     let oldValue = this._data[$1];
                    //     let newValue = e.detail;
                    //     item.textContent = item.textContent.replace(oldValue,newValue);
                    // })
                    //初始化的时候我们就实例化watcher
                    new Watcher(this._data,$1,(newValue)=>{
                        let oldValue = this._data[$1];
                        item.textContent = item.textContent.replace(oldValue,newValue);
                    })
                }
            }
        })
    }
}

class Dep{
    constructor(){
        this.subs = [];
    }
    //手机watcher
    addSub(sub){
        this.subs.push(sub);
    }
    //通知watcher发生变化
    notify(newValue){
        this.subs.forEach(sub=>sub.update(newValue))
    }
}

class Watcher{
    constructor(data,key,cb){
        //这个地方是很重要的一点，手机依赖的时候我们把new Watcher直接保存到Dep.target的静态属性中。
        Dep.target = this;
        //自动触发get方法，手机watcher
        data[key];
        this.cb = cb;
        //把静态属性重置为null 防止数据累加
        Dep.target = null;
    }
    update(newValue){
        this.cb(newValue);
    }
}