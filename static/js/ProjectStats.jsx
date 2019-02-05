import React from "react";
import ReactTable from 'react-table';
import 'react-table/react-table.css'

export default class ProjectStats extends React.Component {

	render(){

		return(
			
 			<ReactTable
                                keyField='id'
                                data={ this.props.projStats }

                                columns = {

                                                [
                                                        {
                                                                Header: 'Project name',
                                                                accessor: 'Project',

                                                        },
                                                        {
                                                                Header: 'Description',
                                                                accessor: 'Description'
                                                        },
                                                        {
                                                                Header: 'Families',
                                                                accessor: 'Families',
                                                                
                                                        },
                                                        {
                                                                Header: 'Samples',
                                                                accessor: 'Samples'

                                                        },
                                                        {

                                                                Header: 'Samples processed',
                                                                accessor: 'Samples_processed'

                                                        },
							{

								Header: '% done',
								accessor: 'percent_done'

							}


                                                ]

                                }
 				style={{ height: "600px" }}
                                minRows={1}
                                className="-striped -highlight"
                                defaultPageSize={10}
                                sortable={true}
                                filterable = {true} />
	

		);
	}

}
