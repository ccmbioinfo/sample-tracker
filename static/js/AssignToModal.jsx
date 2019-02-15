import React from "react";
import { Image,PanelGroup, Radio, Grid, Row, Panel, Form, Button, FormGroup,FormControl,ControlLabel,Checkbox,Col} from 'react-bootstrap';
import {UPDATE_ANALYSIS_FIELDS,FETCH_USER_LIST} from './Url.jsx';

export default class AssignToModal extends React.Component {

	constructor(props) {
        super(props);
        this.state = {
            selectedDropDownStatus: '',
            buttonDisabled: true,
            userList: []
        };
		this.setValue = this.setValue.bind(this);
        this.updateAssignedUser = this.updateAssignedUser.bind(this);

    }
    componentDidMount(){
        
        fetch(FETCH_USER_LIST)
        .then(resp => resp.json())
        .then(data => this.setState({userList: data}));
    
    }
    setValue(event){

		this.setState({

			selectedDropDownStatus: event.target.value,
			buttonDisabled: event.target.value.length == 0 ? true : false
		});

	}
    updateAssignedUser(){

        console.log(this.props.selectedSamples);
        fetch(UPDATE_ANALYSIS_FIELDS,{

                    method: "post",
                    headers: {

                        'Accept': 'application/json, text/plain, */*',
                        'Content-Type': 'application/json',
                        'X-CSRFToken': document.getElementById('csrf_token').value
                    },
                    body: JSON.stringify({"datasets":this.props.selectedSamples,"updateTo":this.state.selectedDropDownStatus, "field": "AssignedTo" })
             })
            .then(response =>response.json())
            .then(data => alert('Assigned samples!')); 

    }
	render(){
    
		return (
		
			<Form>
				<FormGroup controlId="updateAnalysisStatus" bsSize="sm">
					<ControlLabel>
					    Assign samples to user:	
					</ControlLabel>
					<FormControl bsSize="sm" componentClass="select" placeholder="select" onChange={this.setValue} value={this.state.selectedDropDownStatus}>
						<option value=""></option>
                        {this.state.userList.map((proj,index) => <option key = {index} value={proj} >{proj}</option> )}
					</FormControl>
				</FormGroup>
			
			<Button disabled={this.state.buttonDisabled} onClick={this.updateAssignedUser}>Submit</Button>
			</Form>
			

		);

	}

}
