import React from "react";
import LoadingOverlay from "react-loading-overlay";

import {
    Col,
    Card,
    CardHeader,
    CardBody,
    CardTitle,
    Row
} from "reactstrap";

class Configurations extends React.Component {
  constructor(props) {
      super(props);
      this.state = {
          loading: false,
      };
  }
  componentDidMount() {

  }
  componentWillUnmount() {

  }
  componentDidUpdate(e) {

  }
  render() {
    return (
      <>
          <LoadingOverlay
              active={this.state.loading}
              spinner
              text='Loading'
              className='content'
          >
              <Row>
                  <Col md="12">
                      <Card className="full-height-page">
                          <CardHeader>
                              <CardTitle tag="h4">Configurations</CardTitle>
                          </CardHeader>
                          <CardBody>
                          </CardBody>
                      </Card>
                  </Col>
              </Row>
          </LoadingOverlay>
      </>
    );
  }
}

export default Configurations;
