'use client'
import React, {Component} from 'react';
import 'jsoneditor/dist/jsoneditor.css';
//import dynamic from 'next/dynamic'

export default class JSONEditor extends Component {
    jsoneditor  = null;
    container  = null;
    constructor(props) {
        super(props); // 用于父子组件传值
    }
    async componentDidMount () {
        console.log("JSONEditor componentDidMount");
        const options = {
            mode: 'code',
            indentation : 4,
            onValidate: this.props.onValidate,
            templates : this.props.templates,
            onChangeText : this.props.onChangeText,
        };
        const JSONEditorX = (await import('jsoneditor')).default
        if(this.jsoneditor == null) {
             this.jsoneditor = new JSONEditorX(this.container, options);
             this.jsoneditor.set(this.props.json);
        
        }
       
    }
    componentWillUnmount () {
        if (this.jsoneditor) {
            this.jsoneditor.destroy();
        }
    }
    destroy = () => {
        if (this.jsoneditor) {
            this.jsoneditor.destroy();
        }
    }
    set = (json) => {
        if (this.jsoneditor) {
            this.jsoneditor.update(json);
        }
    }
    get = () => {
        if(this.jsoneditor) {
            return this.jsoneditor.get()
        }
    }
    render() {
        return (
            <div style={{height: this.props.height}} ref={elem => this.container = elem} />
        );
    }
}