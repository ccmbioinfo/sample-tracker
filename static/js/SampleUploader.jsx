import React from "react";
import BootstrapTable from 'react-bootstrap-table-next';
import {Tabs, Tab,  Button} from 'react-bootstrap';
import ManualInputTable from './SampleUploaderDataGrid';
import ManualUpdateTable from './SampleUpdaterDataGrid';
import {GET_LOGGED_USER} from './Url.jsx';

const divStyle = {padding: "10px"};
export default class SampleUploader extends React.Component{

    constructor(props) {
        super(props);
        this.state = { key:2, accessLevel: ''};
        this.handleSelect = this.handleSelect.bind(this);
    }
    componentDidMount(){

        fetch(GET_LOGGED_USER)
        .then(resp => resp.json())
        .then(data => {
                        let key = 2;
                        if (data.accessLevel != 'Regular'){

                            key = 3;

                        }
                        this.setState({accessLevel: data.accessLevel, key:key});
                        });
    }
    handleSelect(key){

        this.setState({ key:key });

    }
  render() {
   
    return  (

        <Tabs style= {{divStyle}} defaultActiveKey={2} onSelect={this.handleSelect} activeKey={this.state.key} id='uploadSwitchTab'>
        <Tab eventKey={2} title="Enter new samples into database">
            <ManualInputTable/>
        </Tab>
        { this.state.accessLevel != 'Regular' &&
        <Tab eventKey={3} title="Update sample analysis status">
            <ManualUpdateTable/>
        
        </Tab>
        }
        </Tabs>
    );
  }
}
