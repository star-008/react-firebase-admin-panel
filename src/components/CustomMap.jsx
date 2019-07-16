import React from "react";
import PropTypes from "prop-types";
// react plugin used to create google maps
import {
    withScriptjs,
    withGoogleMap,
    GoogleMap,
    Marker
} from "react-google-maps";

const propTypes = {
    onMarkerDragEnd: PropTypes.func
};

class CustomMap extends React.Component {
    constructor(props) {
        super(props);
        this.state = {

        };

        this.onMarkerDragEnd = this.onMarkerDragEnd.bind(this);
    }
    static defaultProps = {
        api_key: '',
        center: null,
        zoom: '',
    };
    componentWillMount() {

    }
    onMarkerClick(e) {

    }
    onMarkerDragEnd(e) {
        if (this.props.onMarkerDragEnd) {
            this.props.onMarkerDragEnd(e);
        }
    }
    getMap() {
        let MapWrapper = withScriptjs(
            withGoogleMap(props => (
                <GoogleMap
                    defaultZoom={this.props.zoom}
                    defaultCenter={this.props.center}
                    defaultOptions={{
                        scrollwheel: false
                    }}
                >
                    <Marker
                        onClick={e => this.onMarkerClick(e)}
                        draggable={true}
                        onDragEnd={ e => this.onMarkerDragEnd(e)}
                        position={this.props.center}
                    />
                </GoogleMap>
            ))
        );
        return (
            <MapWrapper
                googleMapURL={"https://maps.googleapis.com/maps/api/js?key=" + this.props.api_key}
                loadingElement={<div style={{ height: `100%` }} />}
                containerElement={<div style={{ height: `100%` }} />}
                mapElement={<div style={{ height: `100%` }} />}
            />
        );
    }
    render() {
        return (
            <div className="custom-map-content">
                {this.getMap()}
            </div>
        );
    }
}

CustomMap.propTypes = propTypes;

export default CustomMap;
