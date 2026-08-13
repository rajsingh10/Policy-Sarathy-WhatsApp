import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Info,
  ArrowLeft,
  ExternalLink,
  CheckCircle,
  FileText,
  Image as ImageIcon,
  Video as VideoIcon,
} from "lucide-react";

export const RequestedTemplateGuide = () => {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto space-y-6 px-0 sm:px-6 lg:px-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3 space-y-3 sm:space-y-0 mb-3">
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/templates/new")}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </Button>
        </div>
      </div>

      <Card className="card-elegant">
        <CardHeader>
          <CardTitle>Requested Template Guide</CardTitle>
          <CardDescription>
            New to templates? Follow these steps to request your first WhatsApp
            template. This page explains everything with links.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <section className="space-y-2">
            <h3 className="text-lg font-semibold">
              What is a Requested Template?
            </h3>
            <p className="text-muted-foreground">
              A requested template is a custom WhatsApp message format you
              submit for approval. Once approved, you can reuse it to send
              messages at scale.
            </p>
          </section>

          <Separator />

          <section className="space-y-3">
            <h3 className="text-lg font-semibold">Prerequisites</h3>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
              <li>
                <strong>Business verification</strong> and WABA properly set up.
              </li>
              <li>
                Prepare your <strong>content</strong>: header (optional), body
                (required), footer (optional).
              </li>
            </ul>
          </section>

          <Separator />

          <section className="space-y-4">
            <h3 className="text-lg font-semibold">
              Step-by-step (same flow as the form)
            </h3>
            <ol className="list-decimal pl-6 space-y-5">
              <li>
                <span className="font-medium">Open the Request form</span>
                <div className="mt-2">
                  <Button
                    className="bg-gradient-primary"
                    onClick={() => navigate("/templates/new")}
                  >
                    Open Request Form
                  </Button>
                </div>
              </li>
              <li>
                <span className="font-medium">Template name and language</span>
                <ul className="list-disc pl-6 mt-2 text-sm space-y-1">
                  <li>
                    Name must be lowercase with underscores (e.g.,
                    order_update).
                  </li>
                  <li>Choose language (e.g., English US).</li>
                </ul>
              </li>
              <li>
                <span className="font-medium">Media sample • Optional</span>
                <ul className="list-disc pl-6 mt-2 text-sm space-y-1">
                  <li>
                    Select media type and upload a sample if needed (e.g.,
                    Image).
                  </li>
                  <li>
                    If using media, your header text input will be disabled.
                  </li>
                </ul>
              </li>
              <li>
                <span className="font-medium">Header • Optional</span>
                <ul className="list-disc pl-6 mt-2 text-sm space-y-1">
                  <li>Short text line, up to 60 characters.</li>
                  <li>
                    Variables allowed like <code>{"{{1}}"}</code>,{" "}
                    <code>{"{{2}}"}</code>.
                  </li>
                </ul>
              </li>
              <li>
                <span className="font-medium">Body</span>
                <ul className="list-disc pl-6 mt-2 text-sm space-y-1">
                  <li>
                    Write the main message. Variables supported (e.g.,{" "}
                    <code>{"{{1}}"}</code>).
                  </li>
                  <li>
                    Use the Add variable button or type <code>{"{{"}</code> to
                    insert a variable placeholder.
                  </li>
                </ul>
              </li>
              <li>
                <span className="font-medium">Variable samples</span>
                <ul className="list-disc pl-6 mt-2 text-sm space-y-1">
                  <li>
                    Provide example values for every variable (
                    <code>{"{{1}}"}</code>, <code>{"{{2}}"}</code>, ...).
                  </li>
                  <li>Do not include personal customer data in samples.</li>
                </ul>
              </li>
              <li>
                <span className="font-medium">Footer • Optional</span>
                <ul className="list-disc pl-6 mt-2 text-sm space-y-1">
                  <li>Short closing line, up to 60 characters.</li>
                </ul>
              </li>
              <li>
                <span className="font-medium">Buttons • Optional</span>
                <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                  <div className="p-3 rounded-md border">
                    <p className="font-medium">Quick Reply</p>
                    <p className="text-muted-foreground">
                      Sends a predefined reply back to you.
                    </p>
                    <pre className="mt-2 whitespace-pre-wrap text-xs">
                      {"Track order"}
                    </pre>
                  </div>
                  <div className="p-3 rounded-md border">
                    <p className="font-medium">Phone Number</p>
                    <p className="text-muted-foreground">
                      Opens the dialer with a phone number.
                    </p>
                    <pre className="mt-2 whitespace-pre-wrap text-xs">
                      {"Call support → +1 555 0100"}
                    </pre>
                  </div>
                  <div className="p-3 rounded-md border">
                    <p className="font-medium">URL</p>
                    <p className="text-muted-foreground">
                      Opens a web link in the browser.
                    </p>
                    <pre className="mt-2 whitespace-pre-wrap text-xs">
                      {"View order → https://example.com/order/123"}
                    </pre>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Up to 10 buttons. If more than 3, they appear in a list.
                </p>
              </li>
              <li>
                <span className="font-medium">Preview and submit</span>
                <ul className="list-disc pl-6 mt-2 text-sm space-y-1">
                  <li>Check the live preview on the right.</li>
                  <li>
                    Click Create Template. Status will be{" "}
                    <span className="font-medium">Pending</span> until reviewed.
                  </li>
                  <li>Track progress in the Templates list.</li>
                </ul>
              </li>
            </ol>
          </section>

          <Separator />

          <section className="space-y-3">
            <h3 className="text-lg font-semibold">Good examples</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="p-3 rounded-md bg-muted/40 border">
                <p className="font-medium">Utility (order update)</p>
                <pre className="mt-1 whitespace-pre-wrap text-xs">
                  {"Order update for {{1}}:"}
                  <br />
                  {"Your package {{2}} will arrive by {{3}}."}
                  <br />
                  {"Track: {{4}}"}
                </pre>
              </div>
              <div className="p-3 rounded-md bg-muted/40 border">
                <p className="font-medium">Marketing (re-engagement)</p>
                <pre className="mt-1 whitespace-pre-wrap text-xs">
                  {"Hi {{1}}, we miss you! Enjoy {{2}}% off till {{3}}."}
                  <br />
                  {"Shop now: {{4}}"}
                </pre>
              </div>
            </div>
          </section>

          <Separator />

          <section className="space-y-3">
            <h3 className="text-lg font-semibold">Do and Don't</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="p-3 rounded-md border">
                <p className="font-medium">Do</p>
                <ul className="list-disc pl-5 mt-1 text-muted-foreground space-y-1">
                  <li>Use clear, concise language</li>
                  <li>Match category to intent</li>
                  <li>Add variable samples for review</li>
                  <li>Keep header under 60 chars</li>
                </ul>
              </div>
              <div className="p-3 rounded-md border">
                <p className="font-medium">Don't</p>
                <ul className="list-disc pl-5 mt-1 text-muted-foreground space-y-1">
                  <li>Include personal data in samples</li>
                  <li>Use all caps or spammy words</li>
                  <li>Mix promotional text in UTILITY</li>
                  <li>Use unsupported media types</li>
                </ul>
              </div>
            </div>
          </section>

          <Separator />

          <section className="space-y-3">
            <h3 className="text-lg font-semibold">Quick actions</h3>
            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                onClick={() => navigate("/templates/new")}
              >
                Request New Template
              </Button>
              <Button variant="outline" onClick={() => navigate("/media")}>
                Open Media
              </Button>
            </div>
          </section>

          <Alert>
            <Info className="w-4 h-4" />
            <AlertTitle>Tips</AlertTitle>
            <AlertDescription>
              Keep names lowercase with underscores (e.g., order_update). Avoid
              overly promotional language unless the template is explicitly for
              promotions.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};

export default RequestedTemplateGuide;
