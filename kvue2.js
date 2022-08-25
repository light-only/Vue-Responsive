class Kvue{
    constructor(options){
        this.$options = options;
        this._data = options.data;
        this.observe(this._data);
        this.compile();
    }
    observe(data){
        let temp = {};
        this._data = new Proxy(data,{
            get(target,key){
                console.log('get');
                temp[key] = new Dep();
                if(Dep.target){
                    temp[key].addSub(Dep.target);
                }
                return Reflect.get(target,key)
            },
            set(target,key,newValue){
                console.log('set');
                temp[key].notify(newValue);
                return Reflect.set(target,key,newValue)
            }
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
                let attrs = item.attributes;
                [...attrs].forEach(attr=>{
                    let attrName = attr.name;
                    let attrValue = attr.value;
                    if(attrName === 'v-model'){
                        console.log(attrName,attrValue)
                        item.value = this._data[attrValue];
                        item.addEventListener('input',(e)=>{
                            console.log(e.target.value);
                            let newValue = e.target.value;
                            this._data[attrValue] = newValue;
                        })
                    }else if(attrName === 'v-html'){
                        item.innerHTML = this._data[attrValue];
                        //收集watcher
                        new Watcher(this._data,attrValue,newValue=>{
                            item.innerHTML = newValue;
                        })
                    }else if(attrName === 'v-text'){
                        item.innerText = this._data[attrValue];
                        new Watcher(this._data,attrValue,newValue=>{
                            item.innerText = newValue;
                        })
                    }
                })
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
    addSub(sub){
        this.subs.push(sub);
    }
    notify(newValue){
        this.subs.forEach(sub=>sub.update(newValue));
    }
}

class Watcher{
    constructor(data,key,cb){
        Dep.target = this;
        data[key];
        this.cb = cb;
        // Dep.target = null;
    }
    update(newValue){
        this.cb(newValue);
    }
}