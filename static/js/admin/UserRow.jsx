import React from "react";
import Col from "react-bootstrap/lib/Col";
import Checkbox from "react-bootstrap/lib/Checkbox";
import FormControl from "react-bootstrap/lib/FormControl";
import Button from "react-bootstrap/lib/Button";
import Row from "react-bootstrap/lib/Row";

export default class UserRow extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            username: this.props.username,
            email: this.props.email,
            isAdmin: !!props.isAdmin,
            password: props.password || "",
            confirmPassword: props.confirmPassword || ""
        }
    }
    render() {
        return (
            <Row style={{paddingBottom: '0.25em'}}>
                <Col xs={1}>{this.state.username}</Col>
                <Col xs={2}>{this.state.email}</Col>
                <Col xs={1}>
                    <Checkbox
                        inline checked={this.state.isAdmin}
                        onChange={e => this.setState({ isAdmin: e.target.checked })}
                    />
                </Col>
                <Col xs={3}>
                    <FormControl
                        type="password" placeholder="New password" autoComplete="new-password"
                        value={this.state.password}
                        onChange={e => this.setState({ password: e.target.value })}
                    />
                </Col>
                <Col xs={3}>
                    <FormControl
                        type="password" placeholder="Confirm password" autoComplete="new-password"
                        value={this.state.confirmPassword}
                        onChange={e => this.setState({ confirmPassword: e.target.value })}
                    />
                </Col>
                <Col xs={2}>
                    <Button
                        bsStyle="primary" style={{marginRight: '0.25em'}}
                        onClick={() => this.props.onUpdate(this.state)}>
                        Update
                    </Button>
                    <Button bsStyle="danger" onClick={() => this.props.onDelete(this.state)}>Delete</Button>
                </Col>
            </Row>
        );
    }
}
