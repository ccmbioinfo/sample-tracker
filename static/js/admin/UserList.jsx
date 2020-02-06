import React from "react";
import Panel from "react-bootstrap/lib/Panel";
import Button from "react-bootstrap/lib/Button";
import Grid from "react-bootstrap/lib/Grid";
import Row from "react-bootstrap/lib/Row";
import Col from "react-bootstrap/lib/Col";
import Checkbox from "react-bootstrap/lib/Checkbox";
import FormControl from "react-bootstrap/lib/FormControl";

export default class UserList extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            userList: []
        };
    }
    componentDidMount() {
        fetch("/admin/users")
            .then(response => response.json())
            .then(userList => this.setState({ userList }));
    }
    render() {
        return (
            <Panel>
                <Panel.Heading style={{
                    paddingTop: '1em',
                    paddingBottom: '1em',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <Panel.Title componentClass="h3">Users</Panel.Title>
                    <Button bsStyle="primary">Add new</Button>
                </Panel.Heading>
                <Panel.Body>
                    <Grid fluid>
                        <Row>
                            <Col xs={1}><h4>Username</h4></Col>
                            <Col xs={2}><h4>Email</h4></Col>
                            <Col xs={1}><h4>Admin?</h4></Col>
                            <Col xs={6}><h4>Change password</h4></Col>
                            <Col xs={2}><h4>Actions</h4></Col>
                        </Row>
                        {this.state.userList.map(user => (
                            <Row>
                                <Col xs={1}>{user.username}</Col>
                                <Col xs={2}>{user.email}</Col>
                                <Col xs={1}><Checkbox inline checked={user.isAdmin}/></Col>
                                <Col xs={3}>
                                    <FormControl type="password" placeholder="New password" autocomplete="new-password"/>
                                </Col>
                                <Col xs={3}>
                                    <FormControl type="password" placeholder="Confirm password" autocomplete="new-password"/>
                                </Col>
                                <Col xs={2}>
                                    <Button bsStyle="primary" style={{marginRight: '0.25em'}}>Update</Button>
                                    <Button bsStyle="danger">Delete</Button>
                                </Col>
                            </Row>
                        ))}
                    </Grid>
                </Panel.Body>
            </Panel>
        );
    }
}