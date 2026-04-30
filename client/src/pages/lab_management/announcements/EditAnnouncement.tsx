import { useEffect, useState } from "react";
import AnnouncementModalContents from "./AnnouncementModalContents";
import { useMutation, useQuery } from "@apollo/client/react";
import RequestWrapper from "../../../common/RequestWrapper";
import { GET_ANNOUNCEMENTS, GET_ANNOUNCEMENT, UPDATE_ANNOUNCEMENT, DELETE_ANNOUNCEMENT, Announcement } from "../../../queries/announcementsQueries";
import { useParams } from "react-router-dom";
import { useMakeTheme } from "../../../common/MakeThemeProvider";


export default function EditAnnouncement() {
  const { id } = useParams<{ id: string }>();
  const makeTheme = useMakeTheme();

  const [announcementDraft, setAnnouncementDraft] = useState<Partial<Announcement>>({});

  const query = useQuery(GET_ANNOUNCEMENT, {
    variables: { id },
  });

  const [updateAnnouncement, mutation] = useMutation(UPDATE_ANNOUNCEMENT, {
    variables: {
      id: id,
      title: announcementDraft.title,
      description: announcementDraft.description,
      linkText: announcementDraft.linkText,
      linkUrl: announcementDraft.linkUrl,
    },
    refetchQueries: [{ query: GET_ANNOUNCEMENTS }, { query: GET_ANNOUNCEMENT, variables: { id } }],
  });

  const [deleteAnnouncement, del] = useMutation(DELETE_ANNOUNCEMENT, {
    variables: { id: id },
    refetchQueries: [{ query: GET_ANNOUNCEMENTS }],
  });

  // After the item has been fetched, fill in the draft
  useEffect(() => {
    if (!query.data?.getAnnouncement) return;
    setAnnouncementDraft({
      ...query.data.getAnnouncement,
      __typename: undefined,
    });
  }, [query.data, setAnnouncementDraft]);

  return (
    <RequestWrapper loading={query.loading || del.loading} error={query.error || del.error} minHeight={322}>
      <>
        <title>{`Edit ${announcementDraft.title ?? "Announcement"} | ${makeTheme.title}`}</title>
        <AnnouncementModalContents
          isNewAnnouncement={false}
          announcementDraft={announcementDraft}
          setAnnouncementDraft={setAnnouncementDraft}
          onSave={updateAnnouncement}
          onDelete={deleteAnnouncement}
          loading={mutation.loading || del.loading}
        />
      </>
    </RequestWrapper>
  );
}
