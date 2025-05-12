import React from 'react';
import JSONView from '@/component/JSONView';
import cache from '@/util/cache';
import invoke from '@/util/invoke'
import common from '@/util/common'
class App extends React.Component {
    editor = null;
    constructor(props) {
        super(props);
        this.state = {
            file: '',
            value: {},
        }
    }
    async componentDidMount() {
        let file = common.getQuery("file")
        let content = await invoke.readFile(file)
        try {
            let value = JSON.parse(content)
            await this.setState({
                file: file,
                value: value,
            })
            cache.addOpenFiles([file])
            setTimeout(this.props.updateTitle, 100)
        } catch (e) {

        }

    }
    pageTitle = () => {
        return <h3>JSON： `{this.state.file} `</h3>
    }

    render() {
        return <div style={{ overflow: 'scroll' }}>
            <JSONView json={this.state.value} />
        </div>

    }
}

export default App
