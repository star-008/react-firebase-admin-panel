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
            last_position: null
        };

        this.onMarkerDragEnd = this.onMarkerDragEnd.bind(this);
    }
    static defaultProps = {
        api_key: '',
        center: null,
        position: null,
        zoom: '',
    };
    shouldComponentUpdate(nextProps, nextState, nextContext) {
        if (nextProps.center === null) {
            return false;
        } else {
            let last_position = this.state.last_position;
            if (last_position === nextProps.center) {
                return false;
            } else {
                this.setState({last_position: nextProps.center});
                return true;
            }
        }
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
                        position={this.props.position}
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
