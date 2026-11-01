import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isDatabaseConfigured, mockCompetitions } from "@/lib/mock-data";

export async function GET(
  _req: Request,
  { params }: { params: { competitionId: string } }
) {
  try {
    if (!isDatabaseConfigured()) {
      const comp = mockCompetitions.find((c) => c.id === params.competitionId) || mockCompetitions[0];
      const submissionMap = new Map();
      for (const sub of comp.submissions) {
        submissionMap.set(sub.teacherId, sub);
      }

      const reportRows = comp.assignees.map((a, index) => {
        const sub = submissionMap.get(a.teacherId);
        const isSubmitted = !!sub;

        let submissionStatus = "CHƯA NỘP";
        if (isSubmitted) {
          submissionStatus = sub.status === "LATE" ? "NỘP MUỘN" : "ĐÚNG HẠN";
        }

        return {
          stt: index + 1,
          teacherId: a.teacherId,
          teacherName: a.teacher.name,
          department: a.teacher.department,
          phone: "",
          isSubmitted,
          submissionStatus,
          submitTime: sub ? sub.submittedAt : null,
          driveFileUrl: sub?.driveFileUrl || null,
          localImageUrl: sub?.localImageUrl || null,
          imageFileName: null,
          note: sub?.note || "",
          reviewStatus: sub?.reviewStatus || "NOT_SUBMITTED",
        };
      });

      const totalAssignees = reportRows.length;
      const totalSubmitted = reportRows.filter((r) => r.isSubmitted).length;
      const totalOnTime = reportRows.filter((r) => r.submissionStatus === "ĐÚNG HẠN").length;
      const totalLate = reportRows.filter((r) => r.submissionStatus === "NỘP MUỘN").length;
      const totalNotSubmitted = totalAssignees - totalSubmitted;
      const completionRate = totalAssignees > 0 ? Math.round((totalSubmitted / totalAssignees) * 100) : 0;

      return NextResponse.json({
        success: true,
        data: {
          competition: {
            id: comp.id,
            title: comp.title,
            description: comp.description,
            link: comp.link,
            deadline: comp.deadline,
            status: comp.status,
            allowLateSubmission: comp.allowLateSubmission,
            creatorName: comp.creator.name,
            createdAt: new Date().toISOString(),
          },
          stats: {
            totalAssignees,
            totalSubmitted,
            totalOnTime,
            totalLate,
            totalNotSubmitted,
            completionRate,
          },
          rows: reportRows,
        },
        isDemoMode: true,
      });
    }
    const competition = await db.competition.findUnique({
      where: { id: params.competitionId },
      include: {
        creator: { select: { id: true, name: true } },
        assignees: {
          include: {
            teacher: {
              select: { id: true, name: true, department: true, phone: true },
            },
          },
          orderBy: [
            { teacher: { department: "asc" } },
            { teacher: { name: "asc" } },
          ],
        },
        submissions: {
          include: {
            teacher: {
              select: { id: true, name: true, department: true },
            },
          },
        },
      },
    });

    if (!competition) {
      return NextResponse.json({ error: "Không tìm thấy cuộc thi" }, { status: 404 });
    }

    // Map chi tiết trạng thái từng giáo viên
    const submissionMap = new Map();
    for (const sub of competition.submissions) {
      submissionMap.set(sub.teacherId, sub);
    }

    const reportRows = competition.assignees.map((a, index) => {
      const sub = submissionMap.get(a.teacherId);
      const isSubmitted = !!sub;

      let submissionStatus = "CHƯA NỘP";
      if (isSubmitted) {
        submissionStatus = sub.status === "LATE" ? "NỘP MUỘN" : "ĐÚNG HẠN";
      }

      return {
        stt: index + 1,
        teacherId: a.teacherId,
        teacherName: a.teacher.name,
        department: a.teacher.department,
        phone: a.teacher.phone || "",
        isSubmitted,
        submissionStatus,
        submitTime: sub ? sub.submittedAt.toISOString() : null,
        driveFileUrl: sub?.driveFileUrl || null,
        localImageUrl: sub?.localImageUrl || null,
        imageFileName: sub?.imageFileName || null,
        note: sub?.note || "",
        reviewStatus: sub?.reviewStatus || "NOT_SUBMITTED",
      };
    });

    const totalAssignees = reportRows.length;
    const totalSubmitted = reportRows.filter(r => r.isSubmitted).length;
    const totalOnTime = reportRows.filter(r => r.submissionStatus === "ĐÚNG HẠN").length;
    const totalLate = reportRows.filter(r => r.submissionStatus === "NỘP MUỘN").length;
    const totalNotSubmitted = totalAssignees - totalSubmitted;
    const completionRate = totalAssignees > 0 ? Math.round((totalSubmitted / totalAssignees) * 100) : 0;

    return NextResponse.json({
      success: true,
      data: {
        competition: {
          id: competition.id,
          title: competition.title,
          description: competition.description,
          link: competition.link,
          deadline: competition.deadline.toISOString(),
          status: competition.status,
          allowLateSubmission: competition.allowLateSubmission,
          creatorName: competition.creator.name,
          createdAt: competition.createdAt.toISOString(),
        },
        stats: {
          totalAssignees,
          totalSubmitted,
          totalOnTime,
          totalLate,
          totalNotSubmitted,
          completionRate,
        },
        rows: reportRows,
      },
    });
  } catch (error) {
    console.error("Report API error:", error);
    return NextResponse.json({ error: "Lỗi tải dữ liệu báo cáo" }, { status: 500 });
  }
}
