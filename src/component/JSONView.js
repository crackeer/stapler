import dynamic from "next/dynamic";

export default function renderJSON(props) {
    let jsonObj = {}
    if (props.json != undefined) {
        jsonObj = props.json
    } else {
        try {
            jsonObj = JSON.parse(props.string)
        } catch (e) {

        }
    }
    const ReactJson = dynamic(() => import('react-json-view'), { ssr: false });

    return <ReactJson src={jsonObj} displayDataTypes={false} iconStyle={'square'} name={false} displayObjectSize={true} collapsed={props.collapsed || false}/>
}