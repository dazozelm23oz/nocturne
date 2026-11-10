export interface Song {
  id?: string;
  album: string;
  albumId?: string;
  artist: string;
  artistId?: string;
  name: string;
  uri: string;
  image: string;
  duration: number;
  explicit?: boolean;
  externalUrl?: string;
}
