import React from "react";
import SearchBox from "./SearchBox";
import SampleUploader from "./SampleUploader";
import CohortStats from "./CohortStats";
import GeneReports from "./GeneReports";
import {Navbar, Nav, NavItem, NavDropdown, MenuItem} from 'react-bootstrap';
import {Link, Route, Redirect} from 'react-router-dom';
import {LinkContainer} from 'react-router-bootstrap';
import {GET_LOGGED_USER, LOGOUT} from './Url.jsx';

const auth_gene_report_users = new Set(["eprice", "gediae", "thartley", "maosmond", "care4rare", "mgillespie", "test"])

export default class Layout extends React.Component{

	constructor(props) {
		super(props);
		this.state = {
			
			username: "",
			accessLevel: "",
		};
        this.logout = this.logout.bind(this);
	}
	componentDidMount(){

		fetch(GET_LOGGED_USER)
		.then((resp) => resp.json())
		.then((data) => {

					this.setState({ username: data.username});
					this.setState({ accessLevel: data.accessLevel});
				}
			);

	}
    logout(){

        window.location.replace(LOGOUT);
    }
	render() {
	return (

		 <div>
    			<Navbar inverse>
  				<Navbar.Header>
    					<Navbar.Brand>
      						<a href="/index">Sample-Tracker</a>
  					</Navbar.Brand>
  				</Navbar.Header>
  				<Nav>
                    
                        <LinkContainer to="/CohortStats">
    					    <NavItem eventKey={1}>
      						    Dashboard
    					    </NavItem>
                        </LinkContainer>
    					<LinkContainer to="/SearchBox">
    						<NavItem eventKey={2} >
      							Search Participants
    						</NavItem>
    					</LinkContainer>
                        <LinkContainer to="/SampleUploader">
    					    <NavItem eventKey={3}>
      						    Upload new participants
    					    </NavItem>
                        </LinkContainer>
						{(auth_gene_report_users.has(this.state.username) || this.state.accessLevel == "Admin") &&
							<LinkContainer to="/GeneReports">
								<NavItem eventKey={5}>
									Gene SNV reports
								</NavItem>
							</LinkContainer>
						}
    			</Nav>
                <Nav pullRight>
    					<NavItem eventKey={4}  onClick={this.logout}>
        					Log out
    					</NavItem>
  				</Nav>
                <Navbar.Text pullRight>Welcome, {this.state.username}</Navbar.Text>
			</Navbar>
            <input type='hidden' id='csrf_token' value={this.props.csrfValue} />
			<div>
				<Route exact path="/index" render={() => (
					<Redirect to="/CohortStats"/>
     				)}/>
				<Route path="/SearchBox" component={SearchBox}/>
                <Route path = "/CohortStats" component={CohortStats}/>
                <Route path="/SampleUploader" component={SampleUploader}/>  
                <Route path="/GeneReports" render={(props) => <GeneReports username={this.state.username}/>}/>  
  			</div>
  		</div>

    );
  }

}
