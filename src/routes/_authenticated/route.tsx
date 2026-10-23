import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    // getSession lê a sessão guardada no navegador (sem ida ao servidor a cada
    // clique). A proteção real dos dados continua no servidor: toda server
    // function valida o JWT e o banco aplica RLS.
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session) {
      throw redirect({
        to: "/auth",
        search: { redirect: location.href },
      });
    }
    return { user: data.session.user };
  },
  component: () => <Outlet />,
});
