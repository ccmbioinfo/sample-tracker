import React from "react";
import BootstrapTable from 'react-bootstrap-table-next';
import {Tabs, Tab,  Button} from 'react-bootstrap';
import ManualInputTable from './SampleUploaderDataGrid';
import ManualUpdateTable from './SampleUpdaterDataGrid';
import {FETCH_PROJECT_LIST, FETCH_UPLOAD_USER_PERMISSIONS} from './Url.jsx';

const divStyle = {overflow: "scroll", margin:"25px "};
export default class SampleUploader extends React.Component{

    constructor(props) {
        super(props);
        this.state = { key:1, permissions: 0, projects: []};
        this.handleSelect = this.handleSelect.bind(this);
    }
    componentDidMount(){

        fetch(FETCH_UPLOAD_USER_PERMISSIONS)
        .then(resp => resp.json())
        .then(data => {
                        let key=1;
                        if(data.permissions == 0){
                            key=2;
                        }
                        this.setState({permissions: data.permissions, key:key});
                        });
        fetch(FETCH_PROJECT_LIST)
        .then(resp => resp.json())
        . then(data => {
                            this.setState({projects: data});

                });
    }
    handleSelect(key){

        this.setState({ key:key });

    }
  render() {
   
    return  (

        <div style={divStyle}>
        <Tabs  defaultActiveKey={1} onSelect={this.handleSelect} activeKey={this.state.key} id='uploadSwitchTab'>
        { this.state.permissions == 1 && 
        
        <Tab eventKey={1} title="Enter new participants into sample tracker">
            <div style={{width: "2500px"}}>
              { this.state.projects.length > 0 &&  <ManualInputTable projectList={this.state.projects} /> }
            </div>
        </Tab>
        }
        <Tab eventKey={2} title="Update participant analysis status">
         <ManualUpdateTable/>
        </Tab>
        </Tabs>
        </div>
    );
  }
}
