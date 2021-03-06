import cn from 'classnames';
import * as React from 'react';
import { connect, MapDispatchToProps } from 'react-redux';
import { NavLink, RouteComponentProps } from 'react-router-dom';
import { Nav } from 'reactstrap';
import { bindActionCreators } from 'redux';
import { StoreState } from '../../../common/store';
import { canFetchMoreOf, fetchMore, ObjectState, ObjectTypes, PlaylistTypes } from '../../../common/store/objects';
import { getPlaylistName, getPlaylistObjectSelector } from '../../../common/store/objects/selectors';
import { setScrollPosition } from '../../../common/store/ui';
import { getPreviousScrollTop } from '../../../common/store/ui/selectors';
import { NormalizedResult } from '../../../types';
import { search } from '../../../common/store/objects/playlists/search/actions';
import WithHeaderComponent from '../../_shared/WithHeaderComponent';
import Spinner from '../../_shared/Spinner/Spinner';
import Header from '../../app/components/Header/Header';
import CustomScroll from '../../_shared/CustomScroll';
import PageHeader from '../../_shared/PageHeader/PageHeader';
import TracksGrid from '../../_shared/TracksGrid/TracksGrid';

interface OwnProps extends RouteComponentProps<{ tag: string, type: string }> {
}

interface PropsFromState {
    playlist: ObjectState<NormalizedResult> | null;
    objectId: string;
    tag: string;
    showType: TabTypes;
    previousScrollTop?: number;
}

interface PropsFromDispatch {
    canFetchMoreOf: typeof canFetchMoreOf;
    fetchMore: typeof fetchMore;
    setScrollPosition: typeof setScrollPosition;
    search: typeof search;
}

interface State {
    scrollTop: number;
}

enum TabTypes {
    TRACKS = 'TRACKS',
    PLAYLISTS = 'PLAYLISTS'
}

type AllProps = OwnProps & PropsFromState & PropsFromDispatch;

class TagsPage extends WithHeaderComponent<AllProps, State> {

    componentDidMount() {
        const { tag, playlist, objectId, search } = this.props;

        if (!playlist && tag && tag.length) {
            search({ tag }, objectId, 25);
        }
    }

    componentWillReceiveProps(nextProps: AllProps) {
        const { tag, playlist, objectId, search, showType } = this.props;

        if ((tag !== nextProps.tag || !playlist) && tag && tag.length || showType !== nextProps.showType) {
            search({ tag: nextProps.tag }, objectId, 25);
        }
    }

    hasMore = (): boolean => {
        const { objectId, canFetchMoreOf } = this.props;

        return canFetchMoreOf(objectId, ObjectTypes.PLAYLISTS) as any;
    }

    loadMore = () => {
        const { objectId, fetchMore, canFetchMoreOf } = this.props;

        if (canFetchMoreOf(objectId, ObjectTypes.PLAYLISTS)) {
            fetchMore(objectId, ObjectTypes.PLAYLISTS);
        }
    }

    render() {
        const {
            objectId,
            playlist,
            showType,
            tag,
        } = this.props;

        if (!playlist || (playlist && !playlist.items.length && playlist.isFetching)) {
            return (
                <Spinner contained={true} />
            );
        }

        return (
            <CustomScroll
                heightRelativeToParent='100%'
                // heightMargin={35}
                allowOuterScroll={true}
                threshold={300}
                isFetching={playlist.isFetching}
                ref={(r) => this.scroll = r}
                loadMore={this.loadMore}
                loader={<Spinner />}
                onScroll={this.debouncedOnScroll}
                hasMore={this.hasMore}
            >

                <Header scrollTop={this.state.scrollTop} />

                <PageHeader
                    title={tag}
                    subtitle={`Most popular ${showType === TabTypes.TRACKS ? 'tracks' : 'playlists'}`}
                />

                <div className='container-fluid charts'>
                    <Nav className='tabs' tabs={true}>
                        <NavLink
                            className={cn('nav-link', { active: showType === TabTypes.TRACKS })}
                            to={`/tags/${tag}/${TabTypes.TRACKS}`}
                            activeClassName='active'
                        >
                            Tracks
                        </NavLink>

                        <NavLink
                            className={cn('nav-link', { active: showType === TabTypes.PLAYLISTS })}
                            activeClassName='active'
                            to={`/tags/${tag}/${TabTypes.PLAYLISTS}`}
                        >
                            Playlists
                        </NavLink>
                    </Nav>
                </div>

                <TracksGrid
                    items={playlist.items}
                    objectId={objectId}
                />
            </CustomScroll>
        );
    }
}

const mapStateToProps = (state: StoreState, props: OwnProps): PropsFromState => {
    const { match: { params: { tag, type } } } = props;

    const showType = (type as TabTypes) || TabTypes.TRACKS;

    const objectId = getPlaylistName(tag, showType === TabTypes.TRACKS ? PlaylistTypes.SEARCH_TRACK : PlaylistTypes.SEARCH_PLAYLIST);

    return {
        objectId,
        playlist: getPlaylistObjectSelector(objectId)(state),
        tag,
        showType,
        previousScrollTop: getPreviousScrollTop(state)
    };
};

const mapDispatchToProps: MapDispatchToProps<PropsFromDispatch, OwnProps> = (dispatch) => bindActionCreators({
    search,
    canFetchMoreOf,
    fetchMore,
    setScrollPosition
}, dispatch);

export default connect(mapStateToProps, mapDispatchToProps)(TagsPage);
