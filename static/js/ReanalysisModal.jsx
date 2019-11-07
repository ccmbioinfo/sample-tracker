import React from "react";
import {Button, Table,FormGroup,FormControl } from 'react-bootstrap';
import {REQUEST_REANALYSIS} from './Url.jsx';

export default class ReanalysisModal extends React.Component {

	constructor(props) {
        super(props);
        this.state = { Notes : [] };
        this.handleNotes = this.handleNotes.bind(this);
        this.requestReanalysis = this.requestReanalysis.bind(this);
    }
    handleNotes(event){

        let curDatasetID=event.target.id;
        let curNotes = event.target.value;
        this.setState( (prevState,currentProps) => {
    
                            let prevArray = prevState.Notes.filter((noteObj) => noteObj.datasetID!=curDatasetID);
                            if(prevArray.length >0){
        
                                return {Notes: [...prevArray, {"datasetID":curDatasetID,"Notes":curNotes}]};
                            }
                            else{

                                return {Notes: [{"datasetID":curDatasetID,"Notes":curNotes}]};

                            }
                        }   
                    );
    }
    requestReanalysis(){

        this.props.selectedSamples.map( 
                
                    (sampleRow) => {

                        let noteObj = this.state.Notes.filter( (noteRow) => noteRow.datasetID==sampleRow.datasetID);
                        if(noteObj.length ==1) {
        
                            sampleRow['reAnalysisNotes'] = noteObj[0].Notes;
    
                        }

                    });
        fetch(REQUEST_REANALYSIS,{
                            
                method: "post",
                headers: {

                    'Accept': 'application/json, text/plain, */*',
                    'Content-Type': 'application/json',
                    'X-CSRFToken': document.getElementById('csrf_token').value
                },
                body: JSON.stringify({"Samples":this.props.selectedSamples})

        })          
        .then(resp => resp.json())
        .then(data =>{
                        
            if(data.Status == 'Error'){
                            
                alert('Error requesting re-analysis. Please contact administrator!');
                        
            }
            else{
            
                alert('Reanalysis requested for selected samples');
            }
        });

    }
	render(){
   
		return (

            <div>
            <Table bordered  hover>
            <thead>
                <tr>
                    <th> Selected participants </th>
                    <th> Notes for reanalysis</th>
                </tr>
            </thead>
            <tbody>
                {this.props.selectedSamples.map ( (sampleRow) => { 
                                                                    return <tr key={sampleRow.datasetID}>
                                                                                <td>{sampleRow.SampleID}</td>
                                                                                <td>    
                                                                                    <FormGroup controlId={String(sampleRow.datasetID)}>
                                                                                    <FormControl componentClass="textarea" placeholder="Enter notes" onChange={this.handleNotes}/>
                                                                                    </FormGroup>
                                                                                </td>
                                                                            </tr>
                                                })}
            </tbody>
            </Table>
            <Button onClick={this.requestReanalysis}>Request reanalysis</Button>
            </div>
        );


	}

}
